// app/studio/[contentType]/[id]/metadata/AddPublisherModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';

interface AddPublisherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string;
}

export function AddPublisherModal({ isOpen, onClose, onSubmit, initialValue = '' }: AddPublisherModalProps) {
    const [pubTitle, setPubTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            setPubTitle(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pubTitle.trim() && !isPending) {
            startTransition(async () => {
                await onSubmit(pubTitle);
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '400px' }}>
             <form onSubmit={handleSubmit}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-main)' }}>إضافة ناشر جديد</h3>
                <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    placeholder="مثال: Bandai Namco"
                    className="profile-input"
                    autoFocus
                    style={{ marginBottom: '1.5rem' }}
                    disabled={isPending}
                />
                <div className={modalStyles.modalActions}>
                    <button type="button" onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                    <button type="submit" className="primary-button" disabled={isPending || !pubTitle.trim()}>
                        {isPending ? 'جار الإنشاء...' : 'إنشاء'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}


