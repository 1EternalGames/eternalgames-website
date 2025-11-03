// app/studio/[contentType]/[id]/metadata/MainImageInput.tsx
'use client';

import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useToast } from '@/lib/toastStore';
import { optimizeImageForUpload, UploadQuality } from '@/lib/image-optimizer';
import { clientAssetUploader } from '@/lib/sanity.client';
import avatarStyles from '../../../../components/ProfileEditForm.module.css';

const UploadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /> </svg> );

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

export function MainImageInput({ currentAssetId, currentAssetUrl, onImageChange, uploadQuality }: {
    currentAssetId: string | null;
    currentAssetUrl: string | null;
    onImageChange: (assetId: string | null, url: string | null) => void;
    uploadQuality: UploadQuality;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAssetUrl);
    const [isUploading, startUpload] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        setPreviewUrl(currentAssetUrl);
    }, [currentAssetUrl]);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('نوع الملف غير صالح. يرجى رفع صورة.', 'left');
            return;
        }

        startUpload(async () => {
            try {
                toast.info('جار تحسين الصورة...', 'left');
                // THE FIX: Get file and final quality from optimizer
                const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, uploadQuality);
                const localUrl = URL.createObjectURL(optimizedFile);
                setPreviewUrl(localUrl);

                // THE FIX: Use final size and quality in the toast
                toast.info(`جار رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');
                
                const asset = await clientAssetUploader.assets.upload('image', optimizedFile, {
                    filename: optimizedFile.name,
                    contentType: optimizedFile.type,
                });
                
                if (asset?._id && asset?.url) {
                    onImageChange(asset._id, asset.url);
                    toast.success('تم رفع الصورة الرئيسية بنجاح.', 'left');
                } else {
                    throw new Error('فشل رفع الصورة إلى Sanity.');
                }
            } catch (error: any) {
                setPreviewUrl(currentAssetUrl);
                onImageChange(currentAssetId, currentAssetUrl);
                toast.error(error.message || 'فشل تحسين الصورة.', 'left');
            }
        });
    }, [onImageChange, toast, currentAssetUrl, currentAssetId, uploadQuality]);
    
    // ... (rest of the component is the same)
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleClear = () => {
        setPreviewUrl(null);
        onImageChange(null, null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.info('تمت إزالة الصورة الرئيسية.', 'left');
    };

    return (
        <>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept="image/*" style={{ display: 'none' }} disabled={isUploading} />
            <motion.div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                style={{
                    aspectRatio: '16/9',
                    border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-color)'}`,
                    backgroundColor: isDragging ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploading ? 'progress' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                }}
            >
                <AnimatePresence>
                    {previewUrl ? (
                        <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%' }}>
                            <Image src={previewUrl} alt="معاينة الصورة المصغرة" fill sizes="300px" style={{ objectFit: 'cover' }} />
                            {isUploading && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: '30px', height: '30px' }}/></div>}
                        </motion.div>
                    ) : (
                        <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {isUploading ? ( <div className="spinner" /> ) : (
                                <>
                                    <p style={{ margin: 0 }}>اسحب وأفلت أو انقر للرفع</p>
                                    <p style={{ fontSize: '1.2rem', margin: '0.5rem 0 0 0' }}>سيتم تحسين الصور الكبيرة تلقائيًا</p>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {previewUrl && (
                <button type="button" onClick={handleClear} className="outline-button" style={{ width: '100%', marginTop: '1rem', color: '#DC2626', borderColor: '#DC2626' }}>
                    إزالة الصورة
                </button>
            )}
        </>
    );
}


