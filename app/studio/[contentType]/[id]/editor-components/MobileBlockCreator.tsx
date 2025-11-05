// app/studio/[contentType]/[id]/editor-components/MobileBlockCreator.tsx
'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompareIcon, TwoImageIcon, FourImageIcon, SingleImageIcon } from '../../../StudioIcons';
import styles from './MobileBlockCreator.module.css';

interface MobileBlockCreatorProps {
    editor: Editor | null;
    onFileUpload: (file: File) => void;
}

const PlusIcon = () => ( <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg> );

const blockOptions = [
    { type: 'image' as const, title: 'صورة', icon: <SingleImageIcon /> },
    { type: 'twoImageGrid' as const, title: 'شبكة ثنائية', icon: <TwoImageIcon /> },
    { type: 'fourImageGrid' as const, title: 'شبكة رباعية', icon: <FourImageIcon /> },
    { type: 'imageCompare' as const, title: 'مقارنة', icon: <CompareIcon /> },
];

const orbContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const satelliteVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (custom: { x: number; y: number }) => ({
        scale: 1, opacity: 1, x: custom.x, y: custom.y,
        transition: { type: 'spring' as const, stiffness: 400, damping: 20 },
    }),
};

export function MobileBlockCreator({ editor, onFileUpload }: MobileBlockCreatorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const addBlock = (type: 'image' | 'imageCompare' | 'twoImageGrid' | 'fourImageGrid') => {
        if (!editor) return;
        setIsOpen(false);
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
        <div className={styles.creatorContainer}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.creatorSatellites}
                        variants={orbContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {blockOptions.map((item, i) => {
                            const numItems = blockOptions.length;
                            const angleIncrement = 90 / (numItems - 1);
                            const angleInDegrees = -90 + (i * angleIncrement); 
                            const angleInRadians = angleInDegrees * (Math.PI / 180);
                            const radius = 85;
                            const x = Math.cos(angleInRadians) * radius;
                            const y = Math.sin(angleInRadians) * radius;
                            return (
                                <motion.div key={item.type} className={styles.satelliteWrapper} custom={{ x, y }} variants={satelliteVariants}>
                                    <button className={styles.satelliteOrb} onClick={() => addBlock(item.type)} disabled={!editor} title={item.title}>
                                        {item.icon}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
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