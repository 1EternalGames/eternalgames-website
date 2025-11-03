// app/studio/[contentType]/[id]/ImageCompareComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useState, useRef, useCallback } from 'react';
import { optimizeImageForUpload } from '@/lib/image-optimizer';
import { clientAssetUploader } from '@/lib/sanity.client';
import { useToast } from '@/lib/toastStore';
import styles from '@/components/ImageCompare.module.css';
import editorStyles from './Editor.module.css';
import Image from 'next/image';

const UploadIcon = () => <svg className={styles.uploadIcon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M17.25 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;
const DeleteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SizeSmallIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="15" width="18" height="6" rx="1"/></svg>;
const SizeMediumIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="10" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>;
const SizeLargeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>;

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

const Dropzone = ({ side, src, onUpload }: { side: 'left' | 'right', src: string | null, onUpload: (file: File) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = (file: File | null | undefined) => { if (file) { onUpload(file); } }; 
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }; 
    const handleDrag = (e: React.DragEvent<HTMLDivElement>, isActive: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragging(isActive); }; 
    return ( <div className={`${styles.dropzone} ${isDragging ? styles.active : ''}`} onDrop={handleDrop} onDragEnter={(e) => handleDrag(e, true)} onDragOver={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)} onClick={() => inputRef.current?.click()}> <input ref={inputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} /> {src && <Image src={src} alt={`Image ${side}`} fill className={styles.imagePreview} />} <div className={styles.dropzoneContent}> <UploadIcon /> <span>{src ? `تغيير الصورة ${side === 'left' ? 1 : 2}` : `أفلت صورة أو انقر للرفع`}</span> </div> </div> ); 
};

export const ImageCompareComponent = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
    const toast = useToast();
    const handleUpload = useCallback(async (file: File, side: 'left' | 'right') => {
        try {
            toast.info('جار تحسين الصورة للرفع...', 'left');
            const quality = editor.storage.uploadQuality || '1080p';
            // THE DEFINITIVE FIX: Destructure the object to get the file.
            const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, quality);

            toast.info(`جار رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');
            
            const asset = await clientAssetUploader.assets.upload('image', optimizedFile, {
                filename: optimizedFile.name,
                contentType: optimizedFile.type,
            });

            if (asset?._id && asset?.url) {
                updateAttributes({
                    [side === 'left' ? 'src1' : 'src2']: asset.url,
                    [side === 'left' ? 'assetId1' : 'assetId2']: asset._id,
                });
                toast.success('تم رفع الصورة بنجاح.', 'left');
            } else {
                throw new Error('فشل رفع أصل الصورة إلى Sanity.');
            }
        } catch (error: any) {
            toast.error(error.message || 'فشل معالجة الصورة.', 'left');
        }
    }, [updateAttributes, toast, editor.storage.uploadQuality]);

    const handleDelete = () => editor.chain().deleteRange({ from: getPos(), to: getPos() + 1 }).focus().run();
    const handleSizeChange = (size: 'small' | 'medium' | 'large') => updateAttributes({ 'data-size': size });
    const currentSize = node.attrs['data-size'] || 'large';

    return (
        <NodeViewWrapper as="div" className={editorStyles.imageCompareContainer} data-size={currentSize} data-drag-handle>
            {(node.attrs.src1 && node.attrs.src2) ? (
                <div className={styles.compareWrapper}>
                    <ReactCompareSlider itemOne={<ReactCompareSliderImage src={node.attrs.src1} alt="Image 1" />} itemTwo={<ReactCompareSliderImage src={node.attrs.src2} alt="Image 2" />} />
                </div>
            ) : (
                <div className={styles.compareWrapper}>
                    <div className={styles.placeholder}>
                        <Dropzone side="left" src={node.attrs.src1} onUpload={(file) => handleUpload(file, 'left')} />
                        <Dropzone side="right" src={node.attrs.src2} onUpload={(file) => handleUpload(file, 'right')} />
                    </div>
                </div>
            )}
             <div className={editorStyles.imageNodeMenu} contentEditable={false}>
                <button onClick={() => handleSizeChange('small')} className={`${editorStyles.bubbleMenuButton} ${currentSize === 'small' ? editorStyles.active : ''}`}><SizeSmallIcon /></button>
                <button onClick={() => handleSizeChange('medium')} className={`${editorStyles.bubbleMenuButton} ${currentSize === 'medium' ? editorStyles.active : ''}`}><SizeMediumIcon /></button>
                <button onClick={() => handleSizeChange('large')} className={`${editorStyles.bubbleMenuButton} ${currentSize === 'large' ? editorStyles.active : ''}`}><SizeLargeIcon /></button>
                <div style={{width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.4rem'}} />
                <button onClick={handleDelete} className={`${editorStyles.bubbleMenuButton} ${editorStyles.deleteButton}`}><DeleteIcon /></button>
            </div>
        </NodeViewWrapper>
    );
};


