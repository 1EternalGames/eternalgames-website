// app/studio/[contentType]/[id]/metadata/AddTagModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal'; // <-- THE FIX: Import generic modal
import modalStyles from '@/components/modals/Modals.module.css';

interface AddTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string;
}

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
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '400px' }}>
            <form onSubmit={handleSubmit}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-main)' }}>إضافة وسم جديد</h3>
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
        </Modal>
    );
}


