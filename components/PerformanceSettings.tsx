// components/PerformanceSettings.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './PerformanceSettings.module.css';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { useBodyClass } from '@/hooks/useBodyClass'; // ADDED

// --- Icons ---
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PerfIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/></svg>;

// Specific Icons for Features
const CardIcon3D = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L2 9l10 6 10-6-10-6z"/><path d="M2 14l10 6 10-6"/><path d="M2 9l10 6 10-6"/></svg>;
const TagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>;
const HeroIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2" ry="2" /><circle cx="12" cy="12" r="3" /></svg>;
const BorderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8V4a2 2 0 0 1 2-2h4" /><path d="M16 2h4a2 2 0 0 1 2 2v4" /><path d="M22 16v4a2 2 0 0 1-2 2h-4" /><path d="M8 22H4a2 2 0 0 1-2-2v-4" /></svg>;
const EyeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const PlayPauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const BlurIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M2 12s3 7 10 7 10-7 10-7 3-7 10-7 10 7 10 7Z" opacity="0.3"/></svg>; // Abstract "eye/blur" representation

interface OptionButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    Icon: React.ComponentType<any>;
    disabled?: boolean;
}

const OptionButton = ({ label, isActive, onClick, Icon, disabled }: OptionButtonProps) => (
    <button 
        onClick={onClick}
        className={`${styles.optionButton} ${isActive ? styles.active : ''}`}
        aria-checked={isActive}
        role="switch"
        disabled={disabled}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
        <div className={styles.buttonIcon}>
            <Icon />
        </div>
        <span>{label}</span>
        <div className={styles.indicator}>
            <div className={styles.indicatorFill} />
        </div>
    </button>
);

export default function PerformanceSettings({ isMobile = false }: { isMobile?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const store = usePerformanceStore();
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        usePerformanceStore.persist.rehydrate();
        setMounted(true);
    }, []);

    // Apply the "no-glass" class to body when glassmorphism is DISABLED
    useBodyClass('no-glass', !store.isGlassmorphismEnabled);

    useClickOutside(containerRef, () => {
        if (!isMobile) setIsOpen(false);
    });

    if (!mounted) {
        return (
            <div className={styles.container}>
                 <button className={styles.triggerButton} disabled style={{ opacity: 0.5 }}>
                    <SettingsIcon />
                 </button>
            </div>
        );
    }

    const isLightMode = resolvedTheme === 'light';
    const isAnimationDisabled = !store.isBackgroundVisible || isLightMode;

    const PanelContent = () => (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <PerfIcon />
                    <h3 className={styles.headerTitle}>تحكم المؤثرات</h3>
                </div>
                {isMobile && (
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className={styles.closeButton}
                        onTouchEnd={() => setIsOpen(false)} 
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>
            
            <div className={styles.optionsGrid}>
                 {/* Heaviest */}
                 <OptionButton 
                    label="حركة الخلفية" 
                    isActive={store.isBackgroundAnimated} 
                    onClick={store.toggleBackgroundAnimation} 
                    Icon={PlayPauseIcon}
                    disabled={isAnimationDisabled} 
                />
                <OptionButton 
                    label="تأثير الزجاج" 
                    isActive={store.isGlassmorphismEnabled} 
                    onClick={store.toggleGlassmorphism} 
                    Icon={BlurIcon}
                />
                 <OptionButton 
                    label="إظهار الخلفية" 
                    isActive={store.isBackgroundVisible} 
                    onClick={store.toggleBackgroundVisibility} 
                    Icon={EyeIcon}
                    disabled={isLightMode}
                />
                
                {/* Moderate */}
                <OptionButton 
                    label="البطاقات الحية" 
                    isActive={store.isLivingCardEnabled} 
                    onClick={store.toggleLivingCard}
                    Icon={CardIcon3D}
                />
                <OptionButton 
                    label="انتقال Hero" 
                    isActive={store.isHeroTransitionEnabled} 
                    onClick={store.toggleHeroTransition} 
                    Icon={HeroIcon}
                />
                
                {/* Light */}
                <OptionButton 
                    label="الوسوم الطائرة" 
                    isActive={store.isFlyingTagsEnabled} 
                    onClick={store.toggleFlyingTags} 
                    Icon={TagIcon}
                />
                 <OptionButton 
                    label="إطارات Cyber" 
                    isActive={store.isCornerAnimationEnabled} 
                    onClick={store.toggleCornerAnimation} 
                    Icon={BorderIcon}
                />
            </div>
        </>
    );

    return (
        <div className={styles.container} ref={containerRef}>
            <button 
                className={styles.triggerButton} 
                onClick={() => setIsOpen(!isOpen)}
                onTouchEnd={(e) => {
                    if (isMobile) {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                aria-label="Performance Settings"
                title="إعدادات الأداء"
                style={isOpen ? { color: 'var(--accent)', transform: 'rotate(90deg)' } : {}}
            >
                <SettingsIcon />
            </button>

            {!isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            className={styles.panel}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ type: "spring", duration: 0.3 }}
                        >
                            <PanelContent />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {isMobile && mounted && isOpen && createPortal(
                <AnimatePresence mode="wait">
                     <motion.div key="backdrop"
                        className={styles.mobileOverlay}
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div key="sheet"
                        className={styles.mobilePanel}
                        initial={{ y: "100%" }} 
                        animate={{ y: "0%" }} 
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <PanelContent />
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}