// app/studio/DeleteConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmationModalProps) {
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = async () => {
        setIsPending(true);
        await onConfirm();
        // No need to set isPending back to false if the modal closes on success
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '450px' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-main)', fontSize: '2rem' }}>تأكيد الحذف</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>
                هل أنت متأكد من رغبتك في حذف <strong style={{ color: 'var(--text-primary)' }}>&quot;{itemName}&quot;</strong>? لا رجعةَ في هذا.
            </p>
            <div className={modalStyles.modalActions}>
                <button onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                <motion.button
                    onClick={handleConfirm}
                    className="primary-button delete-forever"
                    style={{ backgroundColor: '#DC2626', boxShadow: 'none' }}
                    disabled={isPending}
                >
                    {isPending ? 'جارٍ الحذف...' : 'حذفٌ نهائي'}
                </motion.button>
            </div>
        </Modal>
    );
}


