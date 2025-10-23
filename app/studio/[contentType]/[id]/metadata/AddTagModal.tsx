// app/studio/[contentType]/[id]/metadata/AddTagModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import modalStyles from '@/components/modals/Modals.module.css';

interface AddTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export function AddTagModal({ isOpen, onClose, onSubmit, initialValue = '' }: AddTagModalProps) {
    const [tagTitle, setTagTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            setTagTitle(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagTitle.trim() && !isPending) {
            startTransition(async () => {
                await onSubmit(tagTitle);
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
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-ui)' }}>إضافة وسم جديد</h3>
                            <input
                                type="text"
                                value={tagTitle}
                                onChange={(e) => setTagTitle(e.target.value)}
                                placeholder="مثال: RPG"
                                className="profile-input"
                                autoFocus
                                style={{ marginBottom: '1.5rem' }}
                                disabled={isPending}
                            />
                            <div className={modalStyles.modalActions}>
                                <button type="button" onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                                <button type="submit" className="primary-button" disabled={isPending || !tagTitle.trim()}>
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





