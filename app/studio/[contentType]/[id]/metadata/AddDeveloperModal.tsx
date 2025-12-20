// app/studio/[contentType]/[id]/metadata/AddDeveloperModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';

interface AddDeveloperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string;
}

export function AddDeveloperModal({ isOpen, onClose, onSubmit, initialValue = '' }: AddDeveloperModalProps) {
    const [devTitle, setDevTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            setDevTitle(initialValue);
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (devTitle.trim() && !isPending) {
            startTransition(async () => {
                await onSubmit(devTitle);
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '400px' }}>
             <form onSubmit={handleSubmit}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-main)' }}>إضافة مطور جديد</h3>
                <input
                    type="text"
                    value={devTitle}
                    onChange={(e) => setDevTitle(e.target.value)}
                    placeholder="مثال: FromSoftware"
                    className="profile-input"
                    autoFocus
                    style={{ marginBottom: '1.5rem' }}
                    disabled={isPending}
                />
                <div className={modalStyles.modalActions}>
                    <button type="button" onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                    <button type="submit" className="primary-button" disabled={isPending || !devTitle.trim()}>
                        {isPending ? 'جار الإنشاء...' : 'إنشاء'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}


