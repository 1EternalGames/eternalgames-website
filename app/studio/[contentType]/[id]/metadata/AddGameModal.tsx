// app/studio/[contentType]/[id]/metadata/AddGameModal.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal'; // <-- THE FIX: Import generic modal
import modalStyles from '@/components/modals/Modals.module.css';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => Promise<void>;
    initialValue?: string;
}

export function AddGameModal({ isOpen, onClose, onSubmit, initialValue = '' }: AddGameModalProps) {
    const [gameTitle, setGameTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            setGameTitle(initialValue);
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
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '400px' }}>
             <form onSubmit={handleSubmit}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-main)' }}>إنشاء لعبة جديدة</h3>
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
        </Modal>
    );
}


