// components/ui/JoinVanguardCard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './JoinVanguardCard.module.css';
import { UserCircleIcon, AllBookmarkIcon } from '@/components/icons';

// Using SVG path for a "Constellation/Network" icon
const ConstellationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default function JoinVanguardCard() {
    const { status } = useSession();
    const { setSignInModalOpen } = useUserStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isDismissed = sessionStorage.getItem('vanguard_dismissed');
        if (status === 'unauthenticated' && !isDismissed) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [status]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('vanguard_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.5 }}
            >
                <button onClick={handleDismiss} className={styles.dismissBtn} aria-label="Dismiss">
                    <CloseIcon />
                </button>

                <div className={styles.iconWrapper}>
                    <UserCircleIcon width={28} height={28} />
                </div>
                
                <h3 className={styles.title}>انضم إلى الطليعة</h3>
                <p className={styles.description}>
                    أنشئ كوكبتك الخاصة واحفظ تقدمك عبر الأجهزة.
                </p>

                <div className={styles.featureList}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><AllBookmarkIcon /></div>
                        <span className={styles.featureText}>مزامنة القراءة</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><ConstellationIcon /></div>
                        <span className={styles.featureText}>سجل الكوكبة</span>
                    </div>
                </div>

                <motion.button 
                    onClick={() => setSignInModalOpen(true)}
                    className={styles.signInBtn}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    إنشاء حساب مجاني
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}