// app/studio/[contentType]/[id]/editor-components/MobileBlockCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompareIcon, TwoImageIcon, FourImageIcon, SingleImageIcon, TableIcon, GameDetailsIcon } from '../../../StudioIcons';
import styles from './MobileBlockCreator.module.css';

interface MobileBlockCreatorProps {
    editor: Editor | null;
    onFileUpload: (file: File) => void;
}

type MenuState = 'root' | 'image';

type MenuAction = 
    | { type: 'submenu'; state: MenuState }
    | { type: 'command'; command: string };

const menuConfig: Record<MenuState, { id: string; title: string; icon: React.ReactNode; action: MenuAction }[]> = {
    root: [
        { id: 'image', title: 'صورة', icon: <SingleImageIcon />, action: { type: 'submenu', state: 'image' } },
        { id: 'table', title: 'جدول', icon: <TableIcon />, action: { type: 'command', command: 'table' } },
        { id: 'gameDetails', title: 'تفاصيل', icon: <GameDetailsIcon />, action: { type: 'command', command: 'gameDetails' } },
        { id: 'compare', title: 'مقارنة', icon: <CompareIcon />, action: { type: 'command', command: 'imageCompare' } },
    ],
    image: [
        { id: 'singleImage', title: 'صورة مفردة', icon: <SingleImageIcon />, action: { type: 'command', command: 'image' } },
        { id: 'twoImageGrid', title: 'شبكة ثنائية', icon: <TwoImageIcon />, action: { type: 'command', command: 'twoImageGrid' } },
        { id: 'fourImageGrid', title: 'شبكة رباعية', icon: <FourImageIcon />, action: { type: 'command', command: 'fourImageGrid' } },
    ],
};

const PlusIcon = () => ( <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg> );

const orbContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
    exit: { opacity: 0, transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const satelliteVariants = {
    hidden: (isRoot: boolean) => ({ scale: 0, opacity: 0, x: isRoot ? 0 : -30 }),
    visible: (custom: { x: number; y: number }) => ({
        scale: 1, opacity: 1, x: custom.x, y: custom.y,
        transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
    }),
    exit: (isRoot: boolean) => ({ scale: 0, opacity: 0, x: isRoot ? 0 : -30, transition: { duration: 0.15 } }),
};

export function MobileBlockCreator({ editor, onFileUpload }: MobileBlockCreatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuState, setMenuState] = useState<MenuState>('root');

    const handleAction = (action: MenuAction) => {
        if (!editor) return;

        if (action.type === 'submenu' && action.state) {
            setMenuState(action.state);
        } else if (action.type === 'command' && action.command) {
            const cmd = action.command;
            if (cmd === 'image') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) { onFileUpload(file); }
                };
                input.click();
            } else if (cmd === 'table') {
                editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();
            } else {
                editor.chain().focus().insertContent({ type: cmd }).run();
            }
            setIsOpen(false);
        }
    };

    const handleMainOrbClick = () => {
        if (!isOpen) {
            setIsOpen(true);
            setMenuState('root');
        } else {
            setIsOpen(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setMenuState('root'), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const currentMenuItems = menuConfig[menuState];

    return (
        <div className={styles.creatorContainer}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key={menuState}
                        className={styles.creatorSatellites}
                        variants={orbContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {currentMenuItems.map((item, i) => {
                            const numItems = currentMenuItems.length;
                            const angleIncrement = 90 / (numItems > 1 ? numItems - 1 : 1);
                            const angleInDegrees = -90 + (i * angleIncrement); 
                            const angleInRadians = angleInDegrees * (Math.PI / 180);
                            const radius = 85;
                            const x = Math.cos(angleInRadians) * radius;
                            const y = Math.sin(angleInRadians) * radius;
                            return (
                                <motion.div key={item.id} className={styles.satelliteWrapper} custom={{ x, y }} variants={satelliteVariants} custom-isRoot={menuState === 'root'}>
                                    <button className={styles.satelliteOrb} onClick={() => handleAction(item.action)} disabled={!editor} title={item.title}>
                                        {item.icon}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={handleMainOrbClick}
                className={`${styles.creatorOrb} ${isOpen ? styles.open : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
            >
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} className={styles.iconContainer}>
                    <PlusIcon />
                </motion.div>
            </motion.button>
        </div>
    );
}