// components/PerformanceSettings.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './PerformanceSettings.module.css';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { useBodyClass } from '@/hooks/useBodyClass';

// --- Icons ---
const SettingsIcon = () => ( <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5"></path> <path d="M9.77208 2.68377L9 5L7.44016 5.98656L4.88796 5.35506C4.46009 5.2492 4.01337 5.43595 3.78816 5.81484L2.42396 8.10993C2.17813 8.52353 2.26167 9.05356 2.62281 9.37147L4.41294 10.9474V13.0526L2.62337 14.6285C2.26231 14.9464 2.17882 15.4764 2.42463 15.8899L3.78888 18.1851C4.01409 18.564 4.46082 18.7508 4.88868 18.6449L7.44089 18.0134L8.91858 18.8421L9.62394 21.2781C9.74775 21.7057 10.1393 22 10.5845 22H13.4163C13.8614 22 14.253 21.7057 14.3768 21.2781L15.0822 18.8421L16.5591 18.0134L19.1113 18.6449C19.5392 18.7508 19.9859 18.564 20.2111 18.1851L21.6011 15.8466C21.8352 15.4528 21.7717 14.9502 21.4471 14.627L19.6409 12.8287L19.6416 11.1713L21.4478 9.37298C21.7725 9.04974 21.836 8.54721 21.6019 8.15339L20.2118 5.81484C19.9866 5.43595 19.5399 5.2492 19.112 5.35506L16.5598 5.98656L15 5L14.2279 2.68377C14.0918 2.27543 13.7097 2 13.2792 2H10.7208C10.2903 2 9.90819 2.27543 9.77208 2.68377Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </svg> );
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PerfIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/></svg>;
const AutoIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M18 6l-6-3-6 3M6 18l6 3 6-3"/></svg>;
const CardIcon3D = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L2 9l10 6 10-6-10-6z"/><path d="M2 14l10 6 10-6"/><path d="M2 9l10 6 10-6"/></svg>;
const TagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>;
const HeroIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2" ry="2" /><circle cx="12" cy="12" r="3" /></svg>;
const BorderIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8V4a2 2 0 0 1 2-2h4" /><path d="M16 2h4a2 2 0 0 1 2 2v4" /><path d="M22 16v4a2 2 0 0 1-2 2h-4" /><path d="M8 22H4a2 2 0 0 1-2-2v-4" /></svg>;
const EyeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const PlayPauseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const BlurIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="M2 12s3 7 10 7 10-7 10-7 3-7 10-7 10 7 10 7Z" opacity="0.3"/></svg>;
const BoltIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const TimerIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-8 8"/></svg>;
const ScrollIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 9l4-4 4 4"/><path d="M16 15l-4 4-4-4"/></svg>; 

interface OptionButtonProps { label: string; isActive: boolean; onClick: () => void; Icon: React.ComponentType<any>; disabled?: boolean; isAutoControlled?: boolean; }

const OptionButton = ({ label, isActive, onClick, Icon, disabled, isAutoControlled }: OptionButtonProps) => (
    <button onClick={onClick} className={`${styles.optionButton} ${isActive ? styles.active : ''}`} aria-checked={isActive} role="switch" disabled={disabled} style={{ ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}), ...(isAutoControlled ? { borderColor: 'var(--accent)', opacity: 0.9 } : {}) }}>
        <div className={styles.buttonIcon}><Icon /></div>
        <span>{label}</span>
        {isAutoControlled && <span style={{position:'absolute', top:2, right:4, fontSize:'0.7rem', color:'var(--accent)', fontWeight:800}}>تلقائي</span>}
        <div className={styles.indicator}><div className={styles.indicatorFill} /></div>
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

    useBodyClass('no-glass', !store.isGlassmorphismEnabled);
    useClickOutside(containerRef, () => { if (!isMobile) setIsOpen(false); });

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
    const auto = store.isAutoTuningEnabled;

    const PanelContent = () => (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}><PerfIcon /><h3 className={styles.headerTitle}>تحكم المؤثرات</h3></div>
                {isMobile && (<button onClick={() => setIsOpen(false)} className={styles.closeButton} onTouchEnd={() => setIsOpen(false)}><CloseIcon /></button>)}
            </div>
            
            <div className={styles.optionsGrid}>
                <OptionButton label="الضبط التلقائي" isActive={store.isAutoTuningEnabled} onClick={store.toggleAutoTuning} Icon={AutoIcon} />
                <OptionButton label="استجابة فورية" isActive={!store.isHoverDebounceEnabled} onClick={store.toggleHoverDebounce} Icon={BoltIcon} isAutoControlled={auto} />
                <OptionButton label="تقليب تلقائي" isActive={store.isCarouselAutoScrollEnabled} onClick={store.toggleCarouselAutoScroll} Icon={TimerIcon} isAutoControlled={auto} />
                
                <OptionButton label="تمرير سلس" isActive={store.isSmoothScrollingEnabled} onClick={store.toggleSmoothScrolling} Icon={ScrollIcon} isAutoControlled={false} />

                <OptionButton label="تأثير الزجاج" isActive={store.isGlassmorphismEnabled} onClick={store.toggleGlassmorphism} Icon={BlurIcon} isAutoControlled={auto} />
                <OptionButton 
                    label="إظهار الخلفية" 
                    isActive={store.isBackgroundVisible} 
                    onClick={store.toggleBackgroundVisibility} 
                    Icon={EyeIcon} 
                    disabled={isLightMode} 
                    isAutoControlled={isMobile ? false : auto} 
                />
                
                <OptionButton label="بطاقات حية" isActive={store.isLivingCardEnabled} onClick={store.toggleLivingCard} Icon={CardIcon3D} isAutoControlled={auto} />
                <OptionButton label="الوسوم الطائرة" isActive={store.isFlyingTagsEnabled} onClick={store.toggleFlyingTags} Icon={TagIcon} isAutoControlled={auto} />
                <OptionButton label="إطارات مشعة" isActive={store.isCornerAnimationEnabled} onClick={store.toggleCornerAnimation} Icon={BorderIcon} isAutoControlled={auto} />
                <OptionButton label="حركة الخلفية" isActive={store.isBackgroundAnimated} onClick={store.toggleBackgroundAnimation} Icon={PlayPauseIcon} disabled={isAnimationDisabled} />
                
                {/* UNLOCKED BUTTON */}
                <OptionButton label="انتقال سلس" isActive={store.isHeroTransitionEnabled} onClick={store.toggleHeroTransition} Icon={HeroIcon} isAutoControlled={auto} /> 
            </div>
        </>
    );

    return (
        <div className={styles.container} ref={containerRef}>
            <button className={styles.triggerButton} onClick={() => setIsOpen(!isOpen)} onTouchEnd={(e) => { if (isMobile) { e.preventDefault(); setIsOpen(!isOpen); } }} aria-label="Performance Settings" title="إعدادات الأداء" style={isOpen ? { color: 'var(--accent)', transform: 'rotate(90deg)' } : {}}>
                <SettingsIcon />
            </button>

            {!isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <motion.div className={styles.panel} initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.95 }} transition={{ type: "spring", duration: 0.3 }}>
                            <PanelContent />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {isMobile && mounted && isOpen && createPortal(
                <AnimatePresence mode="wait">
                     <motion.div key="backdrop" className={styles.mobileOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} />
                    <motion.div key="sheet" className={styles.mobilePanel} initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} onClick={(e) => e.stopPropagation()} >
                        <PanelContent />
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}