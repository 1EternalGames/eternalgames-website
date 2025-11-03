// app/studio/[contentType]/[id]/ImageResizeComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './Editor.module.css';

const SizeSmallIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="15" width="18" height="6" rx="1"/></svg>;
const SizeMediumIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="10" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>;
const SizeLargeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>;
const DeleteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export const ImageResizeComponent = ({ editor, node, updateAttributes, getPos }: NodeViewProps) => {
    
    const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
        updateAttributes({ 'data-size': size });
    };

    const handleDelete = () => {
        editor.chain().deleteRange({ from: getPos(), to: getPos() + 1 }).focus().run()
    }

    const currentSize = node.attrs['data-size'] || 'large';
    const { assetId, 'data-size': dataSize, ...imgAttributes } = node.attrs;

    return (
        <NodeViewWrapper 
            className={styles.imageNodeContainer} 
            data-size={currentSize}
            data-drag-handle
        >
            <img {...imgAttributes} alt={imgAttributes.alt || ''} />

            {/* THE FIX: The menu is no longer conditional */}
            <div className={styles.imageNodeMenu} contentEditable={false}>
                <button onClick={() => handleSizeChange('small')} className={`${styles.bubbleMenuButton} ${currentSize === 'small' ? styles.active : ''}`}><SizeSmallIcon /></button>
                <button onClick={() => handleSizeChange('medium')} className={`${styles.bubbleMenuButton} ${currentSize === 'medium' ? styles.active : ''}`}><SizeMediumIcon /></button>
                <button onClick={() => handleSizeChange('large')} className={`${styles.bubbleMenuButton} ${currentSize === 'large' ? styles.active : ''}`}><SizeLargeIcon /></button>
                <div style={{width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.4rem'}} />
                <button onClick={handleDelete} className={`${styles.bubbleMenuButton} ${styles.deleteButton}`}><DeleteIcon /></button>
            </div>
        </NodeViewWrapper>
    );
};





