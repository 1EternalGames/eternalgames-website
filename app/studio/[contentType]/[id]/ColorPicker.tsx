// app/studio/[contentType]/[id]/ColorPicker.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import styles from './ColorPicker.module.css';

// MODIFIED: Added a 'representative' color for each category to be used as the visual tab.
const COLOR_PALETTE = [
    { title: 'Grays', representative: '#9CA3AF', colors: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937'] },
    { title: 'Reds', representative: '#F87171', colors: ['#FEF2F2', '#FEE2E2', '#FECACA', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'] },
    { title: 'Oranges', representative: '#FB923C', colors: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412', '#7C2D12', '#431407'] },
    { title: 'Yellows', representative: '#FACC15', colors: ['#FEFCE8', '#FEF9C3', '#FEF08A', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E', '#713F12', '#422006'] },
    { title: 'Greens', representative: '#4ADE80', colors: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D', '#052e16'] },
    { title: 'Cyans', representative: '#22D3EE', colors: ['#ECFEFF', '#CFFAFE', '#A5F3FC', '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63', '#083344'] },
    { title: 'Blues', representative: '#60A5FA', colors: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554'] },
    { title: 'Purples', representative: '#A78BFA', colors: ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#2E1065'] },
];

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const Swatch = ({ color, isActive, onClick, className = '' }: { color: string, isActive: boolean, onClick: () => void, className?: string }) => (
    <motion.button
        type="button"
        onClick={onClick}
        className={`${styles.swatchButton} ${className}`}
        style={{ backgroundColor: color }}
        animate={{ scale: isActive ? 1.2 : 1, zIndex: isActive ? 1 : 0 }}
        whileHover={{ scale: 1.3, zIndex: 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
        {isActive && <motion.div className={styles.activeIndicator} layoutId="color-picker-active-swatch" />}
    </motion.button>
);

export function ColorPicker({ editor, popoverStyle }: { editor: Editor, popoverStyle: React.CSSProperties }) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState(COLOR_PALETTE[0].title);

    const currentColor = editor.getAttributes('textStyle').color || '#FFFFFF'; // Default to white
    const activePalette = COLOR_PALETTE.find(p => p.title === activeTab);
    const isCustomColor = !COLOR_PALETTE.flatMap(s => s.colors).some(c => c.toLowerCase() === currentColor.toLowerCase());

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
            <div className={styles.categoryGrid}>
                {COLOR_PALETTE.map(section => (
                    <button
                        key={section.title}
                        onClick={() => setActiveTab(section.title)}
                        className={styles.categoryButton}
                        style={{ backgroundColor: section.representative }}
                        aria-label={`Select ${section.title} colors`}
                    >
                        {activeTab === section.title && (
                            <motion.div className={styles.activeCategoryHighlight} layoutId="color-picker-active-category" />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    className={styles.swatchGrid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {activePalette?.colors.map(color => (
                        <Swatch
                            key={color}
                            color={color}
                            isActive={!isCustomColor && currentColor.toLowerCase() === color.toLowerCase()}
                            onClick={() => handleSetColor(color)}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

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