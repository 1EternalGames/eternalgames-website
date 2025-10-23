// app/studio/[contentType]/[id]/editor-components/TwoImageGridComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useToast } from '@/lib/toastStore';
import { optimizeImageForUpload } from '@/lib/image-optimizer';
import { clientAssetUploader } from '@/lib/sanity.client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from '../Editor.module.css';
import compareStyles from '@/components/ImageCompare.module.css';

const UploadIcon = () => ( <svg className={compareStyles.uploadIcon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M17.25 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg> );
const DeleteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

const Dropzone = ({ side, src, onUpload }: { side: number, src: string | null, onUpload: (file: File) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = (file: File | null | undefined) => { if (file) onUpload(file); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); };
    const handleDrag = (e: React.DragEvent<HTMLDivElement>, isActive: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragging(isActive); };

    return (
        <div className={`${compareStyles.dropzone} ${isDragging ? compareStyles.active : ''}`} onDrop={handleDrop} onDragEnter={(e) => handleDrag(e, true)} onDragOver={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
            {src && <Image src={src} alt={`Image ${side}`} fill className={compareStyles.imagePreview} />}
            <div className={compareStyles.dropzoneContent} style={{fontSize: '1.4rem'}}>
                <UploadIcon />
                <span>{src ? `تغيير الصورة` : `أفلت صورة أو انقر للرفع`}</span>
            </div>
        </div>
    );
};

export const TwoImageGridComponent = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
    const toast = useToast();
    const handleUpload = useCallback(async (file: File, slot: 1 | 2) => {
        try {
            toast.info('جار تحسين الصورة للرفع...', 'left');
            const quality = editor.storage.uploadQuality || '1080p';
            // --- THE FIX IS HERE (PART 1) ---
            // Correctly destructure the object returned by the optimizer.
            const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, quality);

            // --- THE FIX IS HERE (PART 2) ---
            // Use the final size and quality percentage in the toast.
            toast.info(`جار رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');

            const asset = await clientAssetUploader.assets.upload('image', optimizedFile, {
                filename: optimizedFile.name,
                contentType: optimizedFile.type,
            });

            if (asset?._id && asset?.url) {
                updateAttributes({ [`src${slot}`]: asset.url, [`assetId${slot}`]: asset._id });
                toast.success('تم رفع الصورة بنجاح.', 'left');
            } else { throw new Error('فشل الرفع'); }
        } catch (error: any) { toast.error(error.message, 'left'); }
    }, [updateAttributes, toast, editor.storage.uploadQuality]);

    const handleDelete = () => editor.chain().deleteRange({ from: getPos(), to: getPos() + 1 }).focus().run();

    return (
        <NodeViewWrapper as="div" className={styles.imageGridContainer} data-drag-handle>
            <div className={compareStyles.twoImageGrid}>
                <Dropzone side={1} src={node.attrs.src1} onUpload={(file) => handleUpload(file, 1)} />
                <Dropzone side={2} src={node.attrs.src2} onUpload={(file) => handleUpload(file, 2)} />
            </div>
            <div className={styles.imageNodeMenu} contentEditable={false}>
                <button onClick={handleDelete} className={`${styles.bubbleMenuButton} ${styles.deleteButton}`} title="Delete Grid"><DeleteIcon /></button>
            </div>
        </NodeViewWrapper>
    );
};