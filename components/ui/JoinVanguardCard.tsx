// components/ui/JoinVanguardCard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './JoinVanguardCard.module.css';
import { UserCircleIcon, AllBookmarkIcon, StarIcon } from '@/components/icons';

// Using SVG path for specific feature icons not in main library
const CommentIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const HistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20v-6M6 20V10M18 20V4"></path>
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// Import Constellation Icon directly
const ConstellationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" role="img" color="currentColor" {...props}>
        <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
        <path d="M20 18C21.1046 18 22 17.1046 22 16C22 14.8954 21.1046 14 20 14C18.8954 14 18 14.8954 18 16C18 17.1046 18.8954 18 20 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
        <path d="M11 22C12.1046 22 13 21.1046 13 20C13 18.8954 12.1046 18 11 18C9.89543 18 9 18.8954 9 20C9 21.1046 9.89543 22 11 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
        <path d="M15 6C16.1046 6 17 5.10457 17 4C17 2.89543 16.1046 2 15 2C13.8954 2 13 2.89543 13 4C13 5.10457 13.8954 6 15 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
        <path d="M4 10C5.10457 10 6 9.10457 6 8C6 6.89543 5.10457 6 4 6C2.89543 6 2 6.89543 2 8C2 9.10457 2.89543 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
        <path d="M14.5 6L12.5 10M13 4.5L6 7.5M12 14L11 18M14 13L18 15M18 17L13 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path>
    </svg>
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
                    <UserCircleIcon width={32} height={32} />
                </div>
                
                <h3 className={styles.title}>انضم إلى الطليعة</h3>
                <p className={styles.description}>
                    سجل دخولك لفتح ميزات "ديوان الصنعة" الكاملة وتخصيص تجربتك.
                </p>

                <div className={styles.featureGrid}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><AllBookmarkIcon /></div>
                        <span className={styles.featureText}>حفظ ومزامنة</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><ConstellationIcon /></div>
                        <span className={styles.featureText}>أوسمة وجوائز</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><CommentIcon /></div>
                        <span className={styles.featureText}>نقاش المجتمع</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><HistoryIcon /></div>
                        <span className={styles.featureText}>سجل القراءة</span>
                    </div>
                </div>

                <motion.button 
                    onClick={() => setSignInModalOpen(true)}
                    className={styles.signInBtn}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                >
                    تسجيل الدخول / إنشاء حساب
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}