// app/studio/[contentType]/[id]/editor-components/TableCreationPopover.tsx
'use client';

import { motion } from 'framer-motion';
import { HorizontalTableIcon, VerticalTableIcon } from '../../../StudioIcons'; // FIXED: Corrected import path
import styles from '../Editor.module.css';

interface TableCreationPopoverProps {
  onSelect: (type: 'horizontal' | 'vertical') => void;
}

const popoverVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.95 },
};

const Tooltip = ({ text }: { text: string }) => (
    <div style={{
        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        marginBottom: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px',
        fontSize: '1.3rem', fontWeight: 500, whiteSpace: 'nowrap', pointerEvents: 'none',
        opacity: 0, transition: 'opacity 0.2s 0.1s'
    }} className="tooltip-text">
        {text}
    </div>
);

export function TableCreationPopover({ onSelect }: TableCreationPopoverProps) {
    return (
        <motion.div
            className={styles.formattingToolbar}
            style={{ padding: '0.5rem', gap: '0.5rem' }}
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <style jsx>{`
                .tooltip-container:hover .tooltip-text {
                    opacity: 1;
                }
            `}</style>
            <div className="tooltip-container" style={{ position: 'relative' }}>
                <button 
                    onClick={() => onSelect('horizontal')} 
                    className={styles.bubbleMenuButton} 
                    style={{ width: '44px', height: '44px' }}
                >
                    <HorizontalTableIcon />
                </button>
                <Tooltip text="جدول قياسي" />
            </div>
        </motion.div>
    );
}