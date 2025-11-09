// app/studio/[contentType]/[id]/editor-components/FourImageGridComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useToast } from '@/lib/toastStore';
import { optimizeImageForUpload } from '@/lib/image-optimizer';
import { uploadSanityAssetAction } from '../../../actions';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from '../Editor.module.css';
import compareStyles from '@/components/ImageCompare.module.css';

const UploadIcon = () => ( <svg className={compareStyles.uploadIcon} fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M17.25 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg> );
const حذفIcon = () => <svg width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

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
                <span>{src ? `تغيير الصورة ${side}` : `أفلت صورةً أو انقر للرفع`}</span>
            </div>
        </div>
    );
};

export const FourImageGridComponent = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
    const toast = useToast();
    const handleUpload = useCallback(async (file: File, slot: 1 | 2 | 3 | 4) => {
        try {
            toast.info('جارٍ تهيئة الصورة للرفع...', 'left');
            const quality = editor.storage.uploadQuality || '1080p';
            const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, quality);

            toast.info(`جارٍ رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');

            const formData = new FormData();
            formData.append('file', optimizedFile);
            const result = await uploadSanityAssetAction(formData);

            if (result.success && result.asset) {
                updateAttributes({ [`src${slot}`]: result.asset.url, [`assetId${slot}`]: result.asset._id });
                toast.success('رُفِعت الصورة.', 'left');
            } else { throw new Error(result.error || 'فشل الرفع'); }
        } catch (error: any) { toast.error(error.message, 'left'); }
    }, [updateAttributes, toast, editor.storage.uploadQuality]);
    
    const handleحذف = () => editor.chain().deleteRange({ from: getPos(), to: getPos() + 1 }).focus().run();

    return (
        <NodeViewWrapper as="div" className={styles.imageGridContainer} data-drag-handle>
            <div className={compareStyles.fourImageGrid}>
                <Dropzone side={1} src={node.attrs.src1} onUpload={(file) => handleUpload(file, 1)} />
                <Dropzone side={2} src={node.attrs.src2} onUpload={(file) => handleUpload(file, 2)} />
                <Dropzone side={3} src={node.attrs.src3} onUpload={(file) => handleUpload(file, 3)} />
                <Dropzone side={4} src={node.attrs.src4} onUpload={(file) => handleUpload(file, 4)} />
            </div>
            <div className={styles.imageNodeMenu} contentEditable={false}>
                 <button onClick={handleحذف} className={`${styles.bubbleMenuButton} ${styles.deleteButton}`} title="حذف الشبكة"><حذفIcon /></button>
            </div>
        </NodeViewWrapper>
    );
};