// app/studio/[contentType]/[id]/ColorPicker.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import styles from './Editor.module.css';

const COLOR_PALETTE = [
    { name: 'Default', value: '#E1E1E6' },
    { name: 'Accent', value: '#00E5FF' },
    { name: 'Red', value: '#F43F5E' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Blue', value: '#3B82F6' },
];

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ColorSwatch = ({ color, isActive, onClick }: { color: string, isActive: boolean, onClick: () => void }) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            animate={{ scale: isActive ? 1.2 : 1 }}
            whileHover={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
            {isActive && <motion.div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }} layoutId="color-picker-active" />}
        </motion.button>
    );
};

export function ColorPicker({ editor }: { editor: Editor }) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const currentColor = editor.getAttributes('textStyle').color || '#E1E1E6';
    const isCustomColor = !COLOR_PALETTE.some(c => c.value === currentColor);

    const handleSetColor = (color: string) => {
        if (color === '#E1E1E6') { // Default color
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
    };

    const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        editor.chain().focus().setColor(event.target.value).run();
    };

    return (
        <>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.2rem' }} />
            {COLOR_PALETTE.map(({ name, value }) => (
                <ColorSwatch 
                    key={name}
                    color={value}
                    isActive={editor.isActive('textStyle', { color: value }) || (name === 'Default' && !editor.getAttributes('textStyle').color)}
                    onClick={() => handleSetColor(value)}
                />
            ))}
             <div style={{ position: 'relative' }}>
                <motion.button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCustomColor ? currentColor : 'var(--bg-primary)',
                        color: isCustomColor ? '#fff' : 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.3 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                    <PlusIcon />
                </motion.button>
                <input
                    ref={colorInputRef}
                    type="color"
                    onInput={handleCustomColorChange}
                    value={currentColor}
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        pointerEvents: 'none',
                        top: '50%',
                        left: '50%',
                    }}
                />
            </div>
        </>
    );
}