// app/studio/[contentType]/[id]/ImageResizeComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import styles from './Editor.module.css';

const DeleteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export const ImageResizeComponent = ({ editor, node, updateAttributes, getPos }: NodeViewProps) => {
    
    const handleDelete = () => {
        editor.chain().deleteRange({ from: getPos(), to: getPos() + 1 }).focus().run()
    }

    // Removed data-size and assetId from props to be passed down
    const { assetId, 'data-size': dataSize, ...imgAttributes } = node.attrs;

    return (
        <NodeViewWrapper 
            className={styles.imageNodeContainer} 
            data-drag-handle
        >
            <img {...imgAttributes} alt={imgAttributes.alt || ''} />

            <div className={styles.imageNodeMenu} contentEditable={false}>
                <button onClick={handleDelete} className={`${styles.bubbleMenuButton} ${styles.deleteButton}`}><DeleteIcon /></button>
            </div>
        </NodeViewWrapper>
    );
};