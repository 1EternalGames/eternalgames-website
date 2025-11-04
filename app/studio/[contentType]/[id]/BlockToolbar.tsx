// app/studio/[contentType]/[id]/BlockToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import { CompareIcon, TwoImageIcon, FourImageIcon, SingleImageIcon } from '../../StudioIcons';
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

    return (
        <motion.div 
            className={styles.blockToolbarContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        >
            <TooltipButton onClick={() => addBlock('image')} title="صورة واحدة" disabled={!editor}><SingleImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('imageCompare')} title="مقارنة صور" disabled={!editor}><CompareIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('twoImageGrid')} title="شبكة صورتين" disabled={!editor}><TwoImageIcon /></TooltipButton>
            <TooltipButton onClick={() => addBlock('fourImageGrid')} title="شبكة 4 صور" disabled={!editor}><FourImageIcon /></TooltipButton>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.4rem' }} />
            <QualityToggle currentQuality={uploadQuality} onQualityChange={onUploadQualityChange} />
        </motion.div>
    );
}