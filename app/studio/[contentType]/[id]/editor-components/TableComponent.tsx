// app/studio/[contentType]/[id]/editor-components/TableComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react';
import styles from '../Editor.module.css';
import gameDetailsStyles from '@/components/content/GameDetails.module.css';

export const TableComponent = ({ editor, getPos, deleteNode }: NodeViewProps) => {
    
    const addColumn = () => {
        editor.chain().focus().addColumnAfter().run();
    };

    const deleteColumn = () => {
        editor.chain().focus().deleteColumn().run();
    };

    const addRow = () => {
        editor.chain().focus().addRowAfter().run();
    };

    return (
        <NodeViewWrapper as="div" className={`${styles.imageGridContainer} imageGridContainer`} data-drag-handle>
            <div className={gameDetailsStyles.detailsContainer}>
                {/* NodeViewContent will render the table's `tbody` content here */}
                <NodeViewContent as="table" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={addRow} className="outline-button">
                    + Add Row
                </button>
                <button onClick={addColumn} className="outline-button">
                    + Add Column
                </button>
                <button onClick={deleteColumn} className="outline-button">
                    - Delete Column
                </button>
                <button onClick={deleteNode} className="outline-button" style={{ borderColor: '#DC2626', color: '#DC2626' }}>
                    Delete Block
                </button>
            </div>
        </NodeViewWrapper>
    );
};