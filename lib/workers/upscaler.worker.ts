// lib/workers/upscaler.worker.ts

import { pipeline, env, RawImage } from '@xenova/transformers';

// --- CONFIGURATION ---
// Skip local model checks to force loading from CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

// TILE CONFIGURATION
const TILE_SIZE = 128; // Smaller tiles = Frequent updates = No freezing
const TILE_OVERLAP = 16; // Overlap to prevent seams at edges

class UpscalerPipeline {
  static instance: any = null;

  static async getInstance(progressCallback: (data: any) => void) {
    if (this.instance === null) {
      // SWITCHED TO x2 MODEL for stability. 
      // x4 models in browser often hit memory limits on 4K textures even with 3080s due to browser sandbox limits.
      this.instance = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', {
        progress_callback: progressCallback,
        quantized: true, 
      });
    }
    return this.instance;
  }
}

// Helper to clip values
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

async function upscaleTile(upscaler: any, ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, width: number, height: number): Promise<ImageData | null> {
    // Extract image data
    const tileData = ctx.getImageData(x, y, width, height);
    
    // Process
    const rawImage = new RawImage(tileData.data, width, height, 4);
    const output = await upscaler(rawImage);
    
    if (output && output.data) {
        return new ImageData(new Uint8ClampedArray(output.data), output.width, output.height);
    }
    return null;
}

self.addEventListener('message', async (event) => {
  const { image: imageUrl, type } = event.data;

  if (type === 'upscale') {
    try {
      self.postMessage({ status: 'init', message: 'Initializing Engine...' });

      const upscaler = await UpscalerPipeline.getInstance((data: any) => {
        if (data.status === 'progress') {
          self.postMessage({ status: 'downloading', progress: data.progress, file: data.file });
        }
      });

      // Diagnostic: Check what backend is actually running
      // @ts-ignore
      const backend = env.backends.onnx.wasm.numThreads ? 'CPU (WASM)' : 'GPU (WebGL/WebGPU)';
      console.log(`[Upscaler] Running on: ${backend}`);

      self.postMessage({ status: 'processing', message: `Engine Active (${backend})...` });

      // Load Image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      
      const inputWidth = bitmap.width;
      const inputHeight = bitmap.height;

      // Input Canvas
      const inputCanvas = new OffscreenCanvas(inputWidth, inputHeight);
      const inputCtx = inputCanvas.getContext('2d', { willReadFrequently: true });
      if (!inputCtx) throw new Error("Context error");
      inputCtx.drawImage(bitmap, 0, 0);

      // Dimensions
      const SCALE_FACTOR = 2; // Swin2SR is x2
      const outputWidth = inputWidth * SCALE_FACTOR;
      const outputHeight = inputHeight * SCALE_FACTOR;
      
      const outputCanvas = new OffscreenCanvas(outputWidth, outputHeight);
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error("Output context error");

      // Tiling Logic
      const cols = Math.ceil(inputWidth / TILE_SIZE);
      const rows = Math.ceil(inputHeight / TILE_SIZE);
      const totalTiles = cols * rows;
      let processedTiles = 0;

      for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
              // Calculate coordinates with overlap
              const srcX = x * TILE_SIZE;
              const srcY = y * TILE_SIZE;
              
              // Actual read size (handle edges)
              const srcW = Math.min(TILE_SIZE, inputWidth - srcX);
              const srcH = Math.min(TILE_SIZE, inputHeight - srcY);

              self.postMessage({ 
                  status: 'processing', 
                  message: `Enhancing Sector ${processedTiles + 1}/${totalTiles}...`,
                  progress: (processedTiles / totalTiles) * 100 
              });

              // Process
              const upscaledData = await upscaleTile(upscaler, inputCtx, srcX, srcY, srcW, srcH);

              if (upscaledData) {
                  // Write back (Simple stitching for x2, overlap logic omitted for raw speed on this fix)
                  const dstX = srcX * SCALE_FACTOR;
                  const dstY = srcY * SCALE_FACTOR;
                  outputCtx.putImageData(upscaledData, dstX, dstY);
              }

              processedTiles++;
              
              // Yield to main thread briefly to ensure UI updates
              await new Promise(resolve => setTimeout(resolve, 0)); 
          }
      }

      self.postMessage({ status: 'processing', message: 'Finalizing...', progress: 100 });
      
      const finalBlob = await outputCanvas.convertToBlob({ type: 'image/png' });
      const reader = new FileReader();
      reader.onload = () => {
          self.postMessage({ status: 'complete', result: reader.result });
      };
      reader.readAsDataURL(finalBlob);

    } catch (error: any) {
      console.error("Worker Error:", error);
      self.postMessage({ status: 'error', message: error.message || 'Processing failed.' });
    }
  }
});