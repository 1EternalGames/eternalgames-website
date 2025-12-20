// lib/workers/upscaler.worker.ts

// Stubbed worker to preserve architecture without the heavy dependency
self.addEventListener('message', async (event) => {
  const { type } = event.data;

  if (type === 'upscale') {
      // Simulate initialization delay
      self.postMessage({ status: 'init', message: 'جاري الاتصال بالمسبك...' });
      
      setTimeout(() => {
          // Return specific maintenance error to UI
          self.postMessage({ 
              status: 'error', 
              message: 'المسبك البصري يخضع للصيانة حالياً. يرجى المحاولة لاحقاً.' 
          });
      }, 1500);
  }
});


