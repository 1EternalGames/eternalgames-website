// components/constellation/ConstellationControlPanel.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@/hooks/useClickOutside';
import styles from './ConstellationControlPanel.module.css';

// --- ICONS ---
const GearIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const StarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const EyeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const MaximizeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>;
const MinimizeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>;
const BloomIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const LineIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;

export type Preset = 'أداء' | 'مُتَّزِن' | 'فائق';
export type ConstellationSettings = {
    activePreset: Preset | 'custom';
    starCountMultiplier: number;
    bloomIntensity: number;
    alwaysShowOrbits: boolean;
    flawlessPathThickness: number;
};

interface ControlPanelProps {
    settings: ConstellationSettings;
    setSettings: (settings: ConstellationSettings) => void;
    onPresetChange: (preset: Preset) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

const OptionButton = ({ label, isActive, onClick, Icon }: { label: string, isActive: boolean, onClick: () => void, Icon: any }) => (
    <button onClick={onClick} className={`${styles.optionButton} ${isActive ? styles.active : ''}`}>
        <div className={styles.buttonIcon}><Icon /></div>
        <span>{label}</span>
        <div className={styles.indicator}><div className={styles.indicatorFill} /></div>
    </button>
);

export default function ConstellationControlPanel({ settings, setSettings, onPresetChange, isFullscreen, onToggleFullscreen }: ControlPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { resolvedTheme } = useTheme();
    const isLightMode = resolvedTheme === 'light';
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useClickOutside(containerRef, () => { if (!isMobile) setIsOpen(false); });

    const handleValueChange = (key: keyof ConstellationSettings, value: number | boolean) => {
        setSettings({ ...settings, activePreset: 'custom', [key]: value });
    };

    const PanelContent = () => (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}><GearIcon /><h3 className={styles.headerTitle}>تحكم الكوكبة</h3></div>
                {isMobile && (<button onClick={() => setIsOpen(false)} className={styles.closeButton}><CloseIcon /></button>)}
            </div>

            <div className={styles.optionsGrid}>
                {/* Presets */}
                <div>
                    <span className={styles.sectionLabel}>إعدادات سريعة</span>
                    <div className={styles.presetGrid}>
                        {(['أداء', 'مُتَّزِن', 'فائق'] as Preset[]).map(p => (
                            <button key={p} className={`${styles.presetButton} ${settings.activePreset === p ? styles.active : ''}`} onClick={() => onPresetChange(p)}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sliders */}
                <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                        <span className={styles.sliderLabel}><StarIcon className={styles.sliderIcon} /> كثافة النجوم</span>
                        <span className={styles.sliderValue}>{settings.starCountMultiplier.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="1.5" step="0.1" value={settings.starCountMultiplier} onChange={(e) => handleValueChange('starCountMultiplier', parseFloat(e.target.value))} className={styles.rangeInput} />
                </div>

                <div className={styles.sliderGroup} style={{ opacity: isLightMode ? 0.5 : 1 }}>
                    <div className={styles.sliderHeader}>
                        <span className={styles.sliderLabel}><BloomIcon className={styles.sliderIcon} /> التوهج</span>
                        <span className={styles.sliderValue}>{isLightMode ? 'OFF' : settings.bloomIntensity.toFixed(1)}</span>
                    </div>
                    <input type="range" min="0" max="2.5" step="0.1" value={settings.bloomIntensity} onChange={(e) => handleValueChange('bloomIntensity', parseFloat(e.target.value))} disabled={isLightMode} className={styles.rangeInput} />
                </div>

                <div className={styles.sliderGroup}>
                    <div className={styles.sliderHeader}>
                        <span className={styles.sliderLabel}><LineIcon className={styles.sliderIcon} /> المسار</span>
                        <span className={styles.sliderValue}>{settings.flawlessPathThickness.toFixed(1)}px</span>
                    </div>
                    <input type="range" min="1" max="5" step="0.5" value={settings.flawlessPathThickness} onChange={(e) => handleValueChange('flawlessPathThickness', parseFloat(e.target.value))} className={styles.rangeInput} />
                </div>

                {/* Toggles */}
                <div className={styles.togglesRow}>
                    <OptionButton label="إظهار المدارات" isActive={settings.alwaysShowOrbits} onClick={() => handleValueChange('alwaysShowOrbits', !settings.alwaysShowOrbits)} Icon={EyeIcon} />
                    <OptionButton label={isFullscreen ? 'تصغير' : 'ملء الشاشة'} isActive={isFullscreen} onClick={onToggleFullscreen} Icon={isFullscreen ? MinimizeIcon : MaximizeIcon} />
                </div>
            </div>
        </>
    );

    return (
        <div className={styles.container} ref={containerRef}>
            <button 
                className={styles.triggerButton} 
                onClick={() => setIsOpen(!isOpen)} 
                title="إعدادات الكوكبة"
                style={isOpen ? { color: 'var(--accent)', transform: 'rotate(90deg)' } : {}}
            >
                <GearIcon />
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

            {isMobile && isOpen && createPortal(
                <AnimatePresence mode="wait">
                    <motion.div key="backdrop" className={styles.mobileOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} />
                    <motion.div key="sheet" className={styles.mobilePanel} initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} onClick={(e) => e.stopPropagation()}>
                        <PanelContent />
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}