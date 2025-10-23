// app/studio/DeleteConfirmationModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import modalStyles from '@/components/modals/Modals.module.css'; // <-- CRITICAL FIX: IMPORT THE CSS MODULE

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string;
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmationModalProps) {
    const [isPending, setIsPending] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (isOpen) {
            setIsPending(false);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsPending(true);
        await onConfirm();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={modalStyles.modalOverlay} // Use modular style
                    style={{ zIndex: 5001 }}
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className={modalStyles.modalContent} // Use modular style
                        style={{ padding: '2rem', maxWidth: '450px' }}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '2rem' }}>تأكيد الحذف</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>هل أنت متأكد من رغبتك في حذف<strong style={{ color: 'var(--text-primary)' }}>&quot;{itemName}&quot;</strong>? This action cannot be undone.
                        </p>
                        <div className={modalStyles.modalActions}> {/* Use modular style */}
                            <button onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                            <motion.button
                                onClick={handleConfirm}
                                className="primary-button delete-forever"
                                style={{
                                    backgroundColor: '#DC2626',
                                    boxShadow: 'none'
                                }}
                                disabled={isPending}
                            >
                                {isPending ? 'جار الحذف...' : 'حذف نهائي'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!isMounted) {
        return null;
    }

    return createPortal(modalContent, document.body);
}





