// lib/workers/upscaler.worker.ts

import { pipeline, env } from '@xenova/transformers';

// Skip local model checks to force loading from CDN (essential for browser env)
env.allowLocalModels = false;
env.useBrowserCache = true;

class UpscalerPipeline {
  static instance: any = null;

  static async getInstance(progressCallback: (data: any) => void) {
    if (this.instance === null) {
      // Using 'swin2SR-classical-sr-x2-64' for a good balance of speed/quality for game art.
      // It upscales by 2x.
      this.instance = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', {
        progress_callback: progressCallback,
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { image, type } = event.data;

  if (type === 'upscale') {
    try {
      // 1. Report Start
      self.postMessage({ status: 'init', message: 'تهيئة المحرك العصبي...' });

      // 2. Load Model
      const upscaler = await UpscalerPipeline.getInstance((data: any) => {
        if (data.status === 'progress') {
          self.postMessage({ status: 'downloading', progress: data.progress, file: data.file });
        }
      });

      // 3. Processing
      self.postMessage({ status: 'processing', message: 'جارٍ رفع الدقة وتعزيز التفاصيل...' });
      
      // The model expects an image URL or Blob.
      const output = await upscaler(image);

      // 4. Done
      // Handle result based on Transformers.js output format
      let url = '';
      if (output && typeof output.toDataURL === 'function') {
          url = output.toDataURL();
      } else if (output && output.canvas) {
          url = output.canvas.toDataURL();
      }

      self.postMessage({ 
        status: 'complete', 
        result: url 
      });

    } catch (error: any) {
      console.error("Worker Error:", error);
      self.postMessage({ status: 'error', message: error.message || 'فشلت معالجة الصورة.' });
    }
  }
});