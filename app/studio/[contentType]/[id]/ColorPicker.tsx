// app/studio/[contentType]/[id]/ColorPicker.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import styles from './ColorPicker.module.css';

// MODIFIED: Expanded color palette with sections
const EXPANDED_COLOR_PALETTE = [
    { title: 'Grays', colors: ['#FFFFFF', '#E1E1E6', '#7D808C', '#6B7280', '#1F2937'] },
    { title: 'Reds', colors: ['#FECACA', '#F87171', '#EF4444', '#DC2626', '#991B1B'] },
    { title: 'Oranges', colors: ['#FED7AA', '#FB923C', '#F97316', '#EA580C', '#9A3412'] },
    { title: 'Greens', colors: ['#BBF7D0', '#4ADE80', '#22C55E', '#16A34A', '#14532D'] },
    { title: 'Teals', colors: ['#99F6E4', '#2DD4BF', '#0D9488', '#00E5FF', '#0891B2'] },
    { title: 'Blues', colors: ['#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB', '#1E3A8A'] },
    { title: 'Purples', colors: ['#DDD6FE', '#A78BFA', '#8B5CF6', '#7C3AED', '#5B21B6'] },
    { title: 'Pinks', colors: ['#FBCFE8', '#F472B6', '#EC4899', '#DB2777', '#9D174D'] },
];

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const Swatch = ({ color, isActive, onClick }: { color: string, isActive: boolean, onClick: () => void }) => (
    <motion.button
        type="button"
        onClick={onClick}
        className={styles.swatchButton}
        style={{ backgroundColor: color }}
        animate={{ scale: isActive ? 1.2 : 1 }}
        whileHover={{ scale: 1.3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
        {isActive && <motion.div className={styles.activeIndicator} layoutId="color-picker-active" />}
    </motion.button>
);

export function ColorPicker({ editor, popoverStyle }: { editor: Editor, popoverStyle: React.CSSProperties }) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const currentColor = editor.getAttributes('textStyle').color || '#FFFFFF'; // Default to white
    const isCustomColor = !EXPANDED_COLOR_PALETTE.flatMap(s => s.colors).some(c => c.toLowerCase() === currentColor.toLowerCase());

    const handleSetColor = (color: string) => {
        if (color === '#FFFFFF') {
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
    };

    const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        editor.chain().focus().setColor(event.target.value).run();
    };

    return (
        <motion.div
            className={styles.colorPickerPopover}
            style={{ ...popoverStyle, left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
        >
            {EXPANDED_COLOR_PALETTE.map(section => (
                <div key={section.title} className={styles.colorSection}>
                    <p className={styles.sectionTitle}>{section.title}</p>
                    <div className={styles.swatchGrid}>
                        {section.colors.map(color => (
                            <Swatch
                                key={color}
                                color={color}
                                isActive={!isCustomColor && currentColor.toLowerCase() === color.toLowerCase()}
                                onClick={() => handleSetColor(color)}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <div className={styles.customColorSection}>
                <p className={styles.sectionTitle}>Custom Color</p>
                <div style={{ position: 'relative' }}>
                    <motion.button
                        type="button"
                        onClick={() => colorInputRef.current?.click()}
                        className={styles.customColorButton}
                        style={{ background: isCustomColor ? currentColor : 'var(--bg-primary)', color: isCustomColor ? '#fff' : 'var(--text-secondary)' }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                        <PlusIcon />
                    </motion.button>
                    <input
                        ref={colorInputRef}
                        type="color"
                        onInput={handleCustomColorChange}
                        value={currentColor}
                        className={styles.customColorInput}
                    />
                </div>
            </div>
        </motion.div>
    );
}