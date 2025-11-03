// hooks/useEditorImageUpload.ts
'use client';

import { useCallback } from 'react';
import { useToast } from '@/lib/toastStore';
import { optimizeImageForUpload } from '@/lib/image-optimizer';
import { clientAssetUploader } from '@/lib/sanity.client';
import { Editor } from '@tiptap/react';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

type UseEditorImageUploadProps = {
    editor: Editor;
    updateAttributes: (attributes: Record<string, any>) => void;
};

export function useEditorImageUpload({ editor, updateAttributes }: UseEditorImageUploadProps) {
    const toast = useToast();

    const handleUpload = useCallback(async (file: File, slot: 1 | 2 | 3 | 4 | 'left' | 'right') => {
        try {
            toast.info('جار تحسين الصورة للرفع...', 'left');
            const quality = editor.storage.uploadQuality || '1080p';
            const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, quality);

            toast.info(`جار رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');

            const asset = await clientAssetUploader.assets.upload('image', optimizedFile, {
                filename: optimizedFile.name,
                contentType: optimizedFile.type,
            });

            if (asset?._id && asset?.url) {
                const isSide = slot === 'left' || slot === 'right';
                const srcKey = isSide ? (slot === 'left' ? 'src1' : 'src2') : `src${slot}`;
                const assetIdKey = isSide ? (slot === 'left' ? 'assetId1' : 'assetId2') : `assetId${slot}`;

                updateAttributes({
                    [srcKey]: asset.url,
                    [assetIdKey]: asset._id,
                });
                toast.success('تم رفع الصورة بنجاح.', 'left');
            } else {
                throw new Error('فشل الرفع');
            }
        } catch (error: any) {
            toast.error(error.message || 'فشل معالجة الصورة.', 'left');
        }
    }, [editor.storage.uploadQuality, toast, updateAttributes]);

    return handleUpload;
}


