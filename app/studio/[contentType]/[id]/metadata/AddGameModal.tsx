// app/studio/[contentType]/[id]/metadata/AddGameModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import modalStyles from '@/components/modals/Modals.module.css';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string; // <-- NEW PROP
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export function AddGameModal({ isOpen, onClose, onSubmit, initialValue = '' }: AddGameModalProps) {
    const [gameTitle, setGameTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            setGameTitle(initialValue); // Pre-fill on open
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gameTitle.trim() && !isPending) {
            startTransition(async () => {
                await onSubmit(gameTitle);
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    onMouseDown={(e) => e.preventDefault()}
                    className={modalStyles.modalOverlay}
                    style={{ zIndex: 5002 }}
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className={modalStyles.modalContent}
                        style={{ padding: '2rem', maxWidth: '400px' }}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-ui)' }}>إنشاء لعبة جديدة</h3>
                            <input
                                type="text"
                                value={gameTitle}
                                onChange={(e) => setGameTitle(e.target.value)}
                                placeholder="مثال: Elden Ring"
                                className="profile-input"
                                autoFocus
                                style={{ marginBottom: '1.5rem' }}
                                disabled={isPending}
                            />
                            <div className={modalStyles.modalActions}>
                                <button type="button" onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                                <button type="submit" className="primary-button" disabled={isPending || !gameTitle.trim()}>
                                    {isPending ? 'جار الإنشاء...' : 'إنشاء'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}





