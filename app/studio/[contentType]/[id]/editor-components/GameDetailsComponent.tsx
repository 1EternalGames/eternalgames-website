// app/studio/[contentType]/[id]/editor-components/GameDetailsComponent.tsx
'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import editorStyles from '../Editor.module.css';
import gameDetailsStyles from '@/components/content/GameDetails.module.css';
import componentStyles from './GameDetailsComponent.module.css'; // MODIFIED: Import new CSS module

const isRTL = (s: string) => {
  if (!s) return true;
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(s);
};

export const GameDetailsComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const details = Array.isArray(node.attrs.details) ? node.attrs.details : [];

  const handleValueChange = (index: number, value: string) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], value };
    updateAttributes({ details: newDetails });
  };

  const handleLabelChange = (index: number, label: string) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], label };
    updateAttributes({ details: newDetails });
  };

  const addRow = () => {
    updateAttributes({ details: [...details, { label: '', value: '' }] });
  };

  const removeRow = (index: number) => {
    const newDetails = details.filter((_: any, i: number) => i !== index);
    updateAttributes({ details: newDetails });
  };

  return (
    <NodeViewWrapper as="div" className={editorStyles.imageGridContainer} data-drag-handle>
      <div className={gameDetailsStyles.detailsContainer}>
        {details.map((detail: { label: string; value: string }, index: number) => (
          <div key={index} className={gameDetailsStyles.detailRow}>
            <input
              type="text"
              value={detail.label}
              onChange={(e) => handleLabelChange(index, e.target.value)}
              placeholder="التصنيف (مثال: الناشر)"
              className={`${gameDetailsStyles.detailLabel} ${editorStyles.sidebarInput}`}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '1.5rem 2rem',
                fontSize: '1.6rem',
                color: 'var(--accent)',
              }}
            />
            <input
              type="text"
              value={detail.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder="القيمة (مثال: Sony)"
              className={`${gameDetailsStyles.detailValue} ${editorStyles.sidebarInput}`}
              dir={isRTL(detail.value) ? 'rtl' : 'ltr'}
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '1.5rem 2rem',
                fontSize: '1.6rem',
              }}
            />
            <button
              onClick={() => removeRow(index)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        ))}
      </div>
      {/* MODIFIED: Translated text and applied responsive styling */}
      <div className={componentStyles.buttonContainer}>
        <button onClick={addRow} className={`outline-button ${componentStyles.actionButton}`}>
          + إضافة صف
        </button>
        <button onClick={deleteNode} className={`outline-button ${componentStyles.actionButton}`} style={{ borderColor: '#DC2626', color: '#DC2626' }}>
          حذف الجدول
        </button>
      </div>
    </NodeViewWrapper>
  );
};