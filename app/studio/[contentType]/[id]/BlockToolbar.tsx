// app/studio/[contentType]/[id]/BlockToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { CompareIcon, TwoImageIcon, FourImageIcon, SingleImageIcon, TableIcon } from '../../StudioIcons';
import { QualityToggle } from './editor-components/QualityToggle';
import { TableCreationPopover } from './editor-components/TableCreationPopover';
import { useClickOutside } from '@/hooks/useClickOutside';
import { UploadQuality } from '@/lib/image-optimizer';
import styles from './BlockToolbar.module.css';
import bubbleStyles from './Editor.module.css';

interface BlockToolbarProps {
    editor: Editor | null;
    onFileUpload: (file: File) => void;
    uploadQuality: UploadQuality;
    onUploadQualityChange: (quality: UploadQuality) => void;
}

const TooltipButton = ({ onClick, title, children, disabled }: { onClick: () => void, title: string, children: React.ReactNode, disabled?: boolean }) => (
    <div className={styles.optionButtonWrapper}>
        <motion.button 
            onClick={onClick} 
            className={`${bubbleStyles.bubbleMenuButton} ${styles.optionButton}`}
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }} 
            title={title}
            disabled={disabled}
        >
            {children}
        </motion.button>
        <div className={styles.optionTooltip}>{title}</div>
    </div>
);

export function BlockToolbar({ editor, onFileUpload, uploadQuality, onUploadQualityChange }: BlockToolbarProps) {
    const [isTablePopoverOpen, setIsTablePopoverOpen] = useState(false);
    const tablePopoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(tablePopoverRef, () => setIsTablePopoverOpen(false));

    const addBlock = (type: 'image' | 'imageCompare' | 'twoImageGrid' | 'fourImageGrid') => {
        if (!editor) return;
        if (type === 'image') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) { onFileUpload(file); }
            };
            input.click();
        } else {
            editor.chain().focus().insertContent({ type }).run();
        }
    };

    const handleTableSelect = (type: 'horizontal' | 'vertical') => {
        if (!editor) return;
        if (type === 'horizontal') {
            editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();
        } else {
            // FIXED: `toggleHeaderColumn` is the correct command.
            editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: false }).toggleHeaderColumn().run();
        }
        setIsTablePopoverOpen(false);
    };

    return (
        <motion.div 
            className={styles.blockToolbarContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        >
            <div ref={tablePopoverRef} className={styles.optionButtonWrapper} style={{ position: 'relative' }}>
                <TooltipButton onClick={() => setIsTablePopoverOpen(prev => !prev)} title="جدول" disabled={!editor}>
                    <TableIcon />
                </TooltipButton>
                <AnimatePresence>
                    {isTablePopoverOpen && (
                        <motion.div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '0.75rem' }}>
                            <TableCreationPopover onSelect={handleTableSelect} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className={bubbleStyles.toolbarDivider} />
            <TooltipButton onClick={() => addBlock('image')} title="صورة مفردة" disabled={!editor}><SingleImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('imageCompare')} title="مضاهاة صورتين" disabled={!editor}><CompareIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('twoImageGrid')} title="شبكة صورتين" disabled={!editor}><TwoImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('fourImageGrid')} title="شبكة 4 صور" disabled={!editor}><FourImageIcon /></TooltipButton>
            <div className={bubbleStyles.toolbarDivider} />
            {/* FIXED: Renamed prop to `onQualityChange` to match component definition */}
            <QualityToggle currentQuality={uploadQuality} onQualityChange={onUploadQualityChange} />
        </motion.div>
    );
}