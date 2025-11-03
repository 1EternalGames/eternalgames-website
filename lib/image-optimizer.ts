// lib/image-optimizer.ts

export type UploadQuality = '1080p' | '4k' | '8k';

const RESOLUTIONS: Record<UploadQuality, { width: number; height: number }> = {
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
    '8k': { width: 7680, height: 4320 },
};

const MAX_UPLOAD_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB Target, aligned with Vercel's Pro plan body limit
const MAX_INITIAL_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB Hard Limit for initial file read

/**
 * A robust, goal-oriented image optimizer.
 * It guarantees the output file will be under MAX_UPLOAD_SIZE_BYTES, or it will fail with a clear error.
 * THE FIX: Returns an object with the file and the final quality setting.
 */
export function optimizeImageForUpload(file: File, quality: UploadQuality): Promise<{ file: File; finalQuality: number; }> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_INITIAL_FILE_SIZE_BYTES) {
        return reject(new Error(`حجم الملف يتجاوز الحد الأقصى (25MB).`));
    }
    if (!file.type.startsWith('image/')) {
        return reject(new Error("الملف ليس صورة صالحة."));
    }

    const resolution = RESOLUTIONS[quality];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        if (!img.width || !img.height) {
            return reject(new Error("تعذر قراءة أبعاد الصورة. قد يكون الملف تالفًا."));
        }

        let { width, height } = img;
        const aspectRatio = width / height;

        if (img.width > resolution.width || img.height > resolution.height) {
            const widthRatio = resolution.width / img.width;
            const heightRatio = resolution.height / img.height;
            const ratio = Math.min(widthRatio, heightRatio);
            width = Math.round(img.width * ratio);
            height = Math.round(img.height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('لا يمكن إنشاء سياق الكانفاس.'));

        ctx.drawImage(img, 0, 0, width, height);
        
        let currentQuality = 0.92;
        
        const attemptCompression = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('فشل تحويل الكانفاس إلى Blob.'));
                
                if (blob.size > MAX_UPLOAD_SIZE_BYTES && currentQuality > 0.5) {
                    currentQuality -= 0.08;
                    attemptCompression();
                } else {
                    if (blob.size > MAX_UPLOAD_SIZE_BYTES) {
                        reject(new Error("تعذر ضغط الصورة إلى حجم مقبول (<4.5MB). الرجاء اختيار جودة أقل أو استخدم صورة مختلفة."));
                    } else {
                        const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                        const optimizedFile = new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() });
                        // THE FIX: Resolve with the object containing file and quality
                        resolve({ file: optimizedFile, finalQuality: currentQuality });
                    }
                }
              }, 'image/jpeg', currentQuality );
        };

        attemptCompression();
      };
      img.onerror = () => reject(new Error("تعذر تحميل الصورة. قد يكون الملف تالفًا أو غير مدعوم."));
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف."));
  });
}


