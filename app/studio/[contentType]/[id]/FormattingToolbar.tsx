// app/studio/[contentType]/[id]/FormattingToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useLayoutEffect, RefObject } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './Editor.module.css';
import { ColorPicker } from './ColorPicker';

// --- Icon Components (with new DragIcon) ---
const DragIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M20.964 4H16.9719M20.964 4C20.964 4.56018 19.4727 5.60678 18.9679 6M20.964 4C20.964 3.43982 19.4727 2.39322 18.9679 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M2.99921 4H6.99136M2.99921 4C2.99921 3.43982 4.49058 2.39322 4.99529 2M2.99921 4C2.99921 4.56018 4.49058 5.60678 4.99529 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M9.81505 22.0006V21.0595C9.81505 20.4116 9.60526 19.781 9.21707 19.2622L5.39435 14.1534C5.07668 13.7288 4.83978 13.2141 4.98565 12.7043C5.34585 11.4454 6.76792 10.3261 8.35901 12.2974L9.95917 14.0049V3.59381C10.0573 1.76459 13.1325 1.18685 13.4504 3.59381V9.52698C14.933 9.33608 21.9162 10.378 20.9003 14.7917C20.8517 15.0026 20.8032 15.2167 20.7557 15.4279C20.5493 16.346 19.9407 17.98 19.2696 18.9355C18.5705 19.9309 18.897 21.5353 18.8172 22.0019" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);
const BoldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>;
const ItalicIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>;
const LinkIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const ListIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const QuoteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M22 11.5667C22 16.8499 17.5222 21.1334 12 21.1334C11.3507 21.1343 10.7032 21.0742 10.0654 20.9545C9.60633 20.8682 9.37678 20.8251 9.21653 20.8496C9.05627 20.8741 8.82918 20.9948 8.37499 21.2364C7.09014 21.9197 5.59195 22.161 4.15111 21.893C4.69874 21.2194 5.07275 20.4112 5.23778 19.5448C5.33778 19.0148 5.09 18.5 4.71889 18.1231C3.03333 16.4115 2 14.1051 2 11.5667C2 6.28357 6.47778 2 12 2C17.5222 2 22 6.28357 22 11.5667Z" /><path d="M10.7456 10C10.7456 9.05719 10.7456 8.58579 10.4347 8.29289C10.1239 8 9.62351 8 8.62281 8C7.62211 8 7.12176 8 6.81088 8.29289C6.5 8.58579 6.5 9.05719 6.5 10C6.5 10.9428 6.5 11.4142 6.81088 11.7071C7.12176 12 7.62211 12 8.62281 12C9.62351 12 10.1239 12 10.4347 11.7071C10.7456 11.4142 10.7456 10.9428 10.7456 10ZM10.7456 10L10.7456 12.0687C10.7456 13.9022 9.41052 15.4571 7.5614 16M17.5 10C17.5 9.05719 17.5 8.58579 17.1891 8.29289C16.8782 8 16.3779 8 15.3772 8C14.3765 8 13.8761 8 13.5653 8.29289C13.2544 8.58579 13.2544 9.05719 13.2544 10C13.2544 10.9428 13.2544 11.4142 13.5653 11.7071C13.8761 12 14.3765 12 15.3772 12C16.3779 12 16.8782 12 17.1891 11.7071C17.5 11.4142 17.5 10.9428 17.5 10ZM17.5 10V12.0687C17.5 13.9022 16.1649 15.4571 14.3158 16" strokeLinecap="round" /></svg>;
const HeadingIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M5 20V4H7V20H5Z" /><path fillRule="evenodd" clipRule="evenodd" d="M17 20V4H19V20H17Z" /><path fillRule="evenodd" clipRule="evenodd" d="M18 13H6V11H18V13Z" /></svg>;
const H1Icon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2.74996 19V5H4.74996V19H2.74996Z" /><path fillRule="evenodd" clipRule="evenodd" d="M12.75 19V5H14.75V19H12.75Z" /><path fillRule="evenodd" clipRule="evenodd" d="M18.3358 9H20.25V17H21.25V19H17.25V17H18.25V11.9142L17.9572 12.2071L16.5429 10.7929L18.3358 9Z" /><path fillRule="evenodd" clipRule="evenodd" d="M13.75 13L3.74996 13L3.74996 11L13.75 11V13Z" /></svg>;
const H2Icon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2 19V5H4V19H2Z" /><path fillRule="evenodd" clipRule="evenodd" d="M12 19V5H14V19H12Z" /><path fillRule="evenodd" clipRule="evenodd" d="M16 12C16 10.3431 17.3431 9 19 9C20.6569 9 22 10.3431 22 12V12.214C22 13.1191 21.6184 13.982 20.9494 14.5909L18.443 17H22V19H16V16.5742L19.5859 13.1273L19.5981 13.1163C19.8539 12.8861 20 12.5581 20 12.214V12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12V12.4H16V12Z" /><path fillRule="evenodd" clipRule="evenodd" d="M13 13L3 13L3 11L13 11V13Z" /></svg>;
const H3Icon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M2 19V5H4V19H2Z" /><path fillRule="evenodd" clipRule="evenodd" d="M12 19V5H14V19H12Z" /><path fillRule="evenodd" clipRule="evenodd" d="M19 11C18.4477 11 18 11.4477 18 12H16C16 10.3431 17.3431 9 19 9C20.6569 9 22 10.3431 22 12C22 12.7684 21.7111 13.4692 21.2361 14C21.7111 14.5308 22 15.2316 22 16C22 17.6569 20.6569 19 19 19C17.3431 19 16 17.6569 16 16H18C18 16.5523 18.4477 17 19 17C19.5523 17 20 16.5523 20 16C20 15.4477 19.5523 15 19 15H18V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11Z" /><path fillRule="evenodd" clipRule="evenodd" d="M13 13L3 13L3 11L13 11L13 13Z" /></svg>;
const ColorPickerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.1353 8.18318L20.7826 8.53589L21.5396 9.29289C21.9302 9.68342 21.9302 10.3166 21.5396 10.7071C21.1491 11.0976 20.5159 11.0976 20.1254 10.7071L13.2929 3.87458C12.9024 3.48405 12.9024 2.85089 13.2929 2.46036C13.6834 2.06984 14.3166 2.06984 14.7071 2.46036L15.4641 3.21737L15.8168 2.86467C16.9697 1.71178 18.8389 1.71178 19.9918 2.86466L21.1353 4.00821C22.2882 5.1611 22.2882 7.0303 21.1353 8.18318Z" /><path d="M13.7071 7.70711C14.0976 7.31658 14.0976 6.68342 13.7071 6.29289C13.3166 5.90237 12.6834 5.90237 12.2929 6.29289L1.87868 16.7071C1.31607 17.2697 1 18.0328 1 18.8284V22C1 22.5523 1.44772 23 2 23H5.17157C5.96722 23 6.73028 22.6839 7.29289 22.1213L17.7071 11.7071C18.0976 11.3166 18.0976 10.6834 17.7071 10.2929C17.3166 9.90237 16.6834 9.90237 16.2929 10.2929L13.5858 13H8.41421L13.7071 7.70711Z" /></svg>;

const headingOptions = [
    { level: 3, icon: <H3Icon /> },
    { level: 2, icon: <H2Icon /> },
    { level: 1, icon: <H1Icon /> },
];

interface FormattingToolbarProps { editor: Editor; onLinkClick: () => void; platform: 'ios' | 'android' | 'desktop' }

export function FormattingToolbar({ editor, onLinkClick, platform }: FormattingToolbarProps) {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null); 
    const headingMenuRef = useRef<HTMLDivElement>(null);
    const colorMenuRef = useRef<HTMLDivElement>(null);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    useClickOutside(headingMenuRef, () => setIsHeadingMenuOpen(false));
    useClickOutside(colorMenuRef, () => setIsColorMenuOpen(false));
    
    const calculatePopoverPosition = (parentRef: RefObject<HTMLDivElement | null>, popoverWidth: number, popoverHeight: number) => {
        if (parentRef.current && toolbarRef.current) { 
            const parentRect = parentRef.current.getBoundingClientRect();
            const toolbarRect = toolbarRef.current.getBoundingClientRect(); 
            const spaceAbove = parentRect.top;
            const spaceBelow = window.innerHeight - parentRect.bottom;
            
            let finalStyle: React.CSSProperties = {};

            // --- Vertical Positioning ---
            let openUp = platform !== 'android';
            if (openUp && spaceAbove < popoverHeight && spaceBelow > popoverHeight) {
                openUp = false;
            } else if (!openUp && spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
                openUp = true;
            }

            if (openUp) {
                finalStyle.bottom = '100%';
                finalStyle.marginBottom = '0.5rem';
            } else {
                finalStyle.top = '100%';
                finalStyle.marginTop = '0.5rem';
            }

            // --- Horizontal Positioning ---
            const triggerCenter = parentRect.left + parentRect.width / 2;
            const spaceLeft = triggerCenter;
            const spaceRight = window.innerWidth - triggerCenter;

            if (spaceLeft > popoverWidth / 2 && spaceRight > popoverWidth / 2) {
                finalStyle.left = '50%';
                finalStyle.transform = 'translateX(-50%)';
            } else if (spaceLeft < popoverWidth / 2) {
                finalStyle.left = 0;
            } else {
                finalStyle.right = 0;
            }

            setPopoverStyle(finalStyle);
        }
    };

    useLayoutEffect(() => {
        if (isHeadingMenuOpen) calculatePopoverPosition(headingMenuRef, 150, 60);
        if (isColorMenuOpen) calculatePopoverPosition(colorMenuRef, 300, 260);
    }, [isHeadingMenuOpen, isColorMenuOpen]);


    const isAnyHeadingActive = editor.isActive('heading', { level: 1 }) || editor.isActive('heading', { level: 2 }) || editor.isActive('heading', { level: 3 });
    const isAnyColorActive = !!editor.getAttributes('textStyle').color;

    return (
        <motion.div
            drag
            dragMomentum={false}
            className={styles.formattingToolbar}
            ref={toolbarRef}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className={styles.dragHandle}>
                <DragIcon />
            </div>
            <div ref={headingMenuRef} style={{ position: 'relative' }}>
                <motion.button onClick={() => setIsHeadingMenuOpen(prev => !prev)} className={`${styles.bubbleMenuButton} ${isAnyHeadingActive ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <HeadingIcon />
                </motion.button>
                <AnimatePresence>
                    {isHeadingMenuOpen && (
                        <motion.div
                            style={{ 
                                position: 'absolute', 
                                display: 'flex', 
                                gap: '0.2rem', 
                                background: 'var(--bg-secondary)', 
                                padding: '0.4rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)', 
                                ...popoverStyle 
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            {headingOptions.map(({ level, icon }) => (
                                <motion.button
                                    key={level}
                                    onClick={() => {
                                        editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
                                        setIsHeadingMenuOpen(false);
                                    }}
                                    className={`${styles.bubbleMenuButton} ${editor.isActive('heading', { level }) ? styles.active : ''}`}
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                >
                                    {icon}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <motion.button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('bold') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><BoldIcon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('italic') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ItalicIcon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('bulletList') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ListIcon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('blockquote') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="اقتباس"><QuoteIcon /></motion.button>
            <motion.button onClick={onLinkClick} className={`${styles.bubbleMenuButton} ${editor.isActive('link') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><LinkIcon /></motion.button>
            <div ref={colorMenuRef} style={{ position: 'relative', display: 'flex' }}>
                <motion.button onClick={() => setIsColorMenuOpen(prev => !prev)} className={`${styles.bubbleMenuButton} ${isAnyColorActive ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <ColorPickerIcon />
                </motion.button>
                <AnimatePresence>
                    {isColorMenuOpen && <ColorPicker editor={editor} popoverStyle={popoverStyle} />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}