// components/releases/AdminPinButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { toggleReleasePin } from '@/app/releases/actions';
import { useToast } from '@/lib/toastStore';
import styles from './AdminPinButton.module.css';

const PinIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
);

export default function AdminPinButton({ releaseId, isPinned }: { releaseId: string, isPinned: boolean }) {
    const [pinned, setPinned] = useState(isPinned);
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        startTransition(async () => {
            const result = await toggleReleasePin(releaseId, pinned);
            if (result.success) {
                setPinned(!pinned);
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <button 
            className={`${styles.pinButton} ${pinned ? styles.pinned : ''}`}
            onClick={handleToggle}
            title={pinned ? "إلغاء التثبيت" : "تثبيت في المقدمة"}
            disabled={isPending}
        >
            {isPending ? <div className={styles.spinner} /> : <PinIcon />}
        </button>
    );
}


