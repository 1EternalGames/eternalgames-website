// components/constellation/ConstellationControlPanel.tsx
'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import styles from './ConstellationControlPanel.module.css';

export type Preset = 'أداء' | 'متوازن' | 'فائق';
export type ConstellationSettings = {
    activePreset: Preset | 'custom';
    starCountMultiplier: number;
    bloomIntensity: number;
    alwaysShowOrbits: boolean;
    flawlessPathThickness: number;
};

const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const panelVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 150, staggerChildren: 0.05, delayChildren: 0.1 } },
    exit: { x: '-100%', opacity: 0, transition: { duration: 0.2 } }
};
const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
};

interface ControlPanelProps {
    settings: ConstellationSettings;
    setSettings: (settings: ConstellationSettings) => void;
    onClose: () => void;
    onPresetChange: (preset: Preset) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

export default function ConstellationControlPanel({ settings, setSettings, onClose, onPresetChange, isFullscreen, onToggleFullscreen }: ControlPanelProps) {
    const { resolvedTheme } = useTheme();
    const isLightMode = resolvedTheme === 'light';

    const handleValueChange = (key: keyof ConstellationSettings, value: number | boolean) => {
        setSettings({ ...settings, activePreset: 'custom', [key]: value });
    };

    return (
        <motion.div className={styles.panelOverlay} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.panel} variants={panelVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                <motion.div className={styles.panelHeader} variants={itemVariants}>
                    <h3>إعدادات الكوكبة</h3>
                    <motion.button onClick={onClose} className={styles.closeButton} whileHover={{ scale: 1.1, rotate: 90 }}><CloseIcon /></motion.button>
                </motion.div>

                <motion.div className={styles.section} variants={itemVariants}>
                    <label className={styles.label}>إعدادات الجودة</label>
                    <div className={styles.presetButtons}>
                        {(['أداء', 'متوازن', 'فائق'] as Preset[]).map(p => (
                            <motion.button key={p} className={`${styles.presetButton} ${settings.activePreset === p ? styles.active : ''}`} onClick={() => onPresetChange(p)} whileTap={{ scale: 0.95 }}>
                                {p}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                <motion.div className={styles.divider} variants={itemVariants} />

                <motion.div className={styles.section} variants={itemVariants}>
                    <label className={styles.label} htmlFor="galaxy-density">كثافة المجرة</label>
                    <input id="galaxy-density" type="range" min="0.1" max="1.5" step="0.1" value={settings.starCountMultiplier} onChange={(e) => handleValueChange('starCountMultiplier', parseFloat(e.target.value))} className={styles.rangeInput} />
                </motion.div>

                <motion.div className={styles.section} variants={itemVariants} style={{ opacity: isLightMode ? 0.5 : 1 }}>
                    <label className={styles.label} htmlFor="bloom-intensity">Bloom Intensity {isLightMode && "(Disabled)"}</label>
                    <input id="bloom-intensity" type="range" min="0" max="2.5" step="0.1" value={settings.bloomIntensity} onChange={(e) => handleValueChange('bloomIntensity', parseFloat(e.target.value))} disabled={isLightMode} className={styles.rangeInput} />
                </motion.div>

                <motion.div className={styles.divider} variants={itemVariants} />

                <motion.div className={styles.section} variants={itemVariants}>
                    <label className={styles.label} htmlFor="path-thickness">سماكة المسار</label>
                    <input id="path-thickness" type="range" min="1" max="3" step="0.1" value={settings.flawlessPathThickness} onChange={(e) => handleValueChange('flawlessPathThickness', parseFloat(e.target.value))} className={styles.rangeInput} />
                </motion.div>

                <motion.div className={styles.section} variants={itemVariants}>
                    <label className={styles.label}>إظهار المدارات دائمًا</label>
                    <button className={`${styles.toggle} ${settings.alwaysShowOrbits ? styles.active : ''}`} onClick={() => handleValueChange('alwaysShowOrbits', !settings.alwaysShowOrbits)}>
                        <motion.div className={styles.toggleHandle} layout transition={{ type: 'spring', stiffness: 500, damping: 25 }} />
                    </button>
                </motion.div>

                <motion.div className={styles.section} variants={itemVariants}>
                    <label className={styles.label}>وضع ملء الشاشة</label>
                    <button className={`${styles.toggle} ${isFullscreen ? styles.active : ''}`} onClick={onToggleFullscreen}>
                        <motion.div className={styles.toggleHandle} layout transition={{ type: 'spring', stiffness: 500, damping: 25 }} />
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}


