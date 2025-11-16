// app/studio/[contentType]/[id]/BlockToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import { CompareIcon, TwoImageIcon, FourImageIcon, SingleImageIcon, GameDetailsIcon, TableIcon } from '../../StudioIcons';
import { QualityToggle } from './editor-components/QualityToggle';
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
    const addBlock = (type: 'image' | 'imageCompare' | 'twoImageGrid' | 'fourImageGrid' | 'gameDetails' | 'table') => {
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
        } else if (type === 'table') {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        } else {
            editor.chain().focus().insertContent({ type }).run();
        }
    };

    return (
        <motion.div 
            className={styles.blockToolbarContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        >
            <TooltipButton onClick={() => addBlock('gameDetails')} title="تفاصيل اللعبة" disabled={!editor}><GameDetailsIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('table')} title="إدراج جدول" disabled={!editor}><TableIcon /></TooltipButton>
            <div className={bubbleStyles.toolbarDivider} />
            <TooltipButton onClick={() => addBlock('image')} title="صورة مفردة" disabled={!editor}><SingleImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('imageCompare')} title="مضاهاة صورتين" disabled={!editor}><CompareIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('twoImageGrid')} title="شبكة صورتين" disabled={!editor}><TwoImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('fourImageGrid')} title="شبكة 4 صور" disabled={!editor}><FourImageIcon /></TooltipButton>
            <div className={bubbleStyles.toolbarDivider} />
            <QualityToggle currentQuality={uploadQuality} onQualityChange={onUploadQualityChange} />
        </motion.div>
    );
}