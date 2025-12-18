// components/PerformanceSettings.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './PerformanceSettings.module.css';

// Local Icons
const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
);

const PerfIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/>
    </svg>
);

interface ToggleRowProps {
    label: string;
    checked: boolean;
    onChange: () => void;
}

const ToggleRow = ({ label, checked, onChange }: ToggleRowProps) => (
    <div className={styles.settingRow}>
        <span className={styles.settingLabel}>{label}</span>
        <button 
            type="button" 
            role="switch" 
            aria-checked={checked} 
            onClick={onChange} 
            className={`${styles.toggle} ${checked ? styles.active : ''}`}
        >
            <motion.div 
                className={styles.toggleHandle} 
                layout 
                transition={{ type: 'spring', stiffness: 500, damping: 30 }} 
            />
        </button>
    </div>
);

export default function PerformanceSettings({ isMobile = false }: { isMobile?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const store = usePerformanceStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        usePerformanceStore.persist.rehydrate();
        setMounted(true);
    }, []);

    useClickOutside(containerRef, () => setIsOpen(false));

    // Don't render content until hydrated to prevent mismatch
    if (!mounted) {
        if (isMobile) return null;
        return (
            <div className={styles.container}>
                 <button className={styles.triggerButton} disabled>
                    <SettingsIcon />
                 </button>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            {!isMobile && (
                <button 
                    className={styles.triggerButton} 
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Performance Settings"
                    title="إعدادات الأداء"
                >
                    <SettingsIcon />
                </button>
            )}

            <AnimatePresence>
                {(isOpen || isMobile) && (
                    <motion.div 
                        className={isMobile ? styles.mobilePanel : styles.panel}
                        initial={isMobile ? { height: 0, opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
                        animate={isMobile ? { height: 'auto', opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isMobile ? { height: 0, opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", duration: 0.3 }}
                    >
                        {!isMobile && (
                            <div className={styles.header}>
                                <PerfIcon />
                                <h3 className={styles.headerTitle}>الأداء والمؤثرات</h3>
                            </div>
                        )}
                        
                        <ToggleRow 
                            label="البطاقات الحية (3D)" 
                            checked={store.isLivingCardEnabled} 
                            onChange={store.toggleLivingCard} 
                        />
                        <ToggleRow 
                            label="الوسوم الطائرة" 
                            checked={store.isFlyingTagsEnabled} 
                            onChange={store.toggleFlyingTags} 
                        />
                        <ToggleRow 
                            label="انتقالات الصور (Hero)" 
                            checked={store.isHeroTransitionEnabled} 
                            onChange={store.toggleHeroTransition} 
                        />
                         <ToggleRow 
                            label="إطارات الزوايا (Cyber)" 
                            checked={store.isCornerAnimationEnabled} 
                            onChange={store.toggleCornerAnimation} 
                        />

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}