// components/CookieConsent.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setConsent } from '@/lib/gtm'; 
import styles from './CookieConsent.module.css';
import CookieSettingsModal from './CookieSettingsModal';

const CookieIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M16 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M11 17v.01" />
        <path d="M7 14v.01" />
    </svg>
);

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('eternal_cookie_consent');
        
        if (stored) {
            try {
                const prefs = JSON.parse(stored);
                setConsent(prefs);
            } catch (e) {
                if (stored === 'granted') setConsent({ analytics: true, marketing: true });
            }
        } else {
            const timer = setTimeout(() => setShowBanner(true), 2500); // Delayed slightly more for intro animations
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const prefs = { analytics: true, marketing: true };
        localStorage.setItem('eternal_cookie_consent', JSON.stringify(prefs));
        setConsent(prefs);
        setShowBanner(false);
    };

    const handleDeclineAll = () => {
        const prefs = { analytics: false, marketing: false };
        localStorage.setItem('eternal_cookie_consent', JSON.stringify(prefs));
        setConsent(prefs);
        setShowBanner(false);
    };

    const handleSavePreferences = (prefs: { analytics: boolean; marketing: boolean }) => {
        localStorage.setItem('eternal_cookie_consent', JSON.stringify(prefs));
        setConsent(prefs);
        setShowBanner(false);
    };

    return (
        <>
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        className={styles.consentBanner}
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className={styles.content}>
                            <div className={styles.iconContainer}><CookieIcon /></div>
                            <div className={styles.textContainer}>
                                <p>
                                    نستخدم ملفات تعريف الارتباط لتحسين تجربتك في EternalGames.
                                </p>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button onClick={() => setShowSettings(true)} className={styles.settingsBtn}>تخصيص</button>
                            <button onClick={handleDeclineAll} className={styles.declineBtn}>رفض الكل</button>
                            <button onClick={handleAcceptAll} className={styles.acceptBtn}>موافق</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <CookieSettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
                onSave={handleSavePreferences} 
            />
        </>
    );
}