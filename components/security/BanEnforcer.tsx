// components/security/BanEnforcer.tsx
'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import styles from './BanEnforcer.module.css';

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.banIcon}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

interface BanEnforcerProps {
    isBanned: boolean;
    reason?: string | null;
}

export default function BanEnforcer({ isBanned, reason }: BanEnforcerProps) {
    
    // Simple effect to lock the body scroll if the user is banned upon page load
    useEffect(() => {
        if (isBanned) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isBanned]);

    if (!isBanned) return null;

    return (
        <div className={styles.banOverlay}>
            <div className={styles.banCard}>
                <LockIcon />
                <h1 className={styles.banTitle}>حساب محظور</h1>
                <p className={styles.banMessage}>
                    تم تعليق وصولك إلى منصة EternalGames. لا يمكنك التفاعل أو تصفح المحتوى الخاص أثناء سريان هذا الحظر.
                </p>
                
                {reason && (
                    <div className={styles.reasonContainer}>
                        <span className={styles.reasonLabel}>سبب الحظر:</span>
                        <p className={styles.reasonText}>{reason}</p>
                    </div>
                )}

                <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="outline-button"
                    style={{ marginTop: '3rem', width: '100%', borderColor: '#333', color: '#888' }}
                >
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );
}


