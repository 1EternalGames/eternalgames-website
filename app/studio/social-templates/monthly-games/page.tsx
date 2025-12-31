// app/studio/social-templates/monthly-games/page.tsx
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import MonthlyGamesCanvas from '@/components/studio/social/monthly-games/MonthlyGamesCanvas';
import { MonthlyGamesTemplateData, GameSlotData } from '@/components/studio/social/monthly-games/types';
import styles from '@/components/studio/social/SocialEditor.module.css';
import { useToast } from '@/lib/toastStore';
import { downloadElementAsImage } from '@/lib/image-export';
import { useBodyClass } from '@/hooks/useBodyClass';
import { SparklesIcon } from '@/components/icons';
import SmartFillerMonthly from '@/components/studio/social/monthly-games/SmartFillerMonthly';
import { SmartFillRelease } from '@/app/studio/social-templates/monthly-games/actions';
import { motion, AnimatePresence } from 'framer-motion';

const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const ChevronDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>);

const createEmptySlot = (id: number): GameSlotData => ({
    id,
    title: 'عنوان اللعبة',
    day: '01',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    platforms: { PC: true, PS5: false, XSX: false, NSW: false },
    badges: { 
        gamePass: false, 
        psPlus: false, 
        exclusive: false, 
        price: { active: false, text: '$70' } 
    },
    imageSettings: { x: 0, y: 0, scale: 1 }
});

const DEFAULT_DATA: MonthlyGamesTemplateData = {
    month: 'شهر نوفمبر',
    slots: Array.from({ length: 9 }).map((_, i) => createEmptySlot(i)),
    vibrance: 100 // Default to 100% (Normal)
};

export default function MonthlyGamesEditor() {
    useBodyClass('editor-active');
    
    const [data, setData] = useState<MonthlyGamesTemplateData>(DEFAULT_DATA);
    const [scale, setScale] = useState(0.4);
    const [isExporting, startExport] = useTransition();
    const [isFillerOpen, setIsFillerOpen] = useState(false);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    const [isMobile, setIsMobile] = useState(false);
    
    // Dropdown state for download options
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!canvasWrapperRef.current) return;
        const updateScale = () => {
            if (!canvasWrapperRef.current) return;
            const { width, height } = canvasWrapperRef.current.getBoundingClientRect();
            const padding = 40; 
            const availableWidth = width - padding;
            const availableHeight = height - padding;
            const scaleX = availableWidth / 1080;
            const scaleY = availableHeight / 1350;
            const cap = isMobile ? 1 : 0.95;
            const newScale = Math.min(scaleX, scaleY, cap);
            setScale(newScale);
        };
        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateScale));
        resizeObserver.observe(canvasWrapperRef.current);
        updateScale(); 
        return () => resizeObserver.disconnect();
    }, [isMobile]);

    const updateData = (newData: Partial<MonthlyGamesTemplateData>) => {
        setData(prev => ({ ...prev, ...newData }));
    };

    const handleDownload = (format: 'png' | 'jpeg', quality: number = 0.9) => {
        setIsExportMenuOpen(false);
        startExport(async () => {
            try {
                // MODIFIED: Pass scale: 2 for 4K (2160x2700) and quality
                await downloadElementAsImage('monthly-games-canvas', `monthly-games-${Date.now()}`, format, 2, quality);
                toast.success(`تم التنزيل (${format.toUpperCase()}) - 4K`);
            } catch (e) {
                console.error(e);
                toast.error("فشل التصدير.");
            }
        });
    };

    const handleSmartFillApply = (selectedReleases: SmartFillRelease[], monthName: string) => {
        const newSlots = [...data.slots];

        selectedReleases.forEach((release, index) => {
            if (index < 9) {
                const day = release.releaseDate.split('-')[2];
                const platforms = release.platforms || [];
                
                newSlots[index] = {
                    ...newSlots[index],
                    title: release.title,
                    day: day,
                    image: release.imageUrl,
                    platforms: {
                        PC: platforms.includes('PC'),
                        PS5: platforms.some(p => p.includes('PlayStation')),
                        XSX: platforms.some(p => p.includes('Xbox')),
                        NSW: platforms.some(p => p.includes('Switch')),
                    },
                    badges: {
                        gamePass: release.onGamePass || false,
                        psPlus: release.onPSPlus || false,
                        exclusive: false, // Default false, requires manual set
                        price: {
                            active: !!release.price,
                            text: release.price || '$70'
                        }
                    },
                    imageSettings: { x: 0, y: 0, scale: 1 }
                };
            }
        });

        setData({
            ...data,
            month: monthName,
            slots: newSlots
        });
        
        toast.success(`تم ملء ${selectedReleases.length} ألعاب.`);
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.mainArea}>
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>قالب: ألعاب الشهر</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', margin: 0 }}>اضغط على العناصر في التصميم لتعديلها.</p>
                    </div>

                    <div className={styles.controlGroup}>
                        <button className={styles.smartFillButton} onClick={() => setIsFillerOpen(true)}>
                            <SparklesIcon width={20} height={20} />
                            <span>الملء الذكي</span>
                        </button>

                        <div className={styles.downloadGroup}>
                            {/* Primary Action: 4K JPG */}
                            <button className={styles.downloadButton} onClick={() => handleDownload('jpeg', 0.9)} disabled={isExporting}>
                                <DownloadIcon />
                                <span style={{ marginRight: '0.8rem' }}>تحميل 4K (JPG)</span>
                            </button>
                            {/* Dropdown Trigger */}
                            <button className={styles.dropdownTrigger} onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={isExporting}>
                                <motion.div animate={{ rotate: isExportMenuOpen ? 180 : 0 }}>
                                    <ChevronDownIcon />
                                </motion.div>
                            </button>
                        </div>
                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isExportMenuOpen && (
                                <motion.div className={styles.dropdownMenu} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <button className={styles.dropdownItem} onClick={() => handleDownload('png')}>تحميل 4K (PNG)</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className={styles.controlGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label}>تشبع الألوان (Vibrance)</label>
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{data.vibrance}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="200"
                            value={data.vibrance || 100}
                            onChange={(e) => updateData({ vibrance: parseInt(e.target.value) })}
                            style={{ 
                                width: '100%', 
                                cursor: 'pointer',
                                accentColor: 'var(--accent)'
                            }}
                        />
                    </div>
                </div>

                <div className={styles.canvasWrapper} ref={canvasWrapperRef}>
                    <div id="monthly-games-canvas-wrapper" style={{ width: 'fit-content', height: 'fit-content' }}>
                         <MonthlyGamesCanvas 
                            data={data} 
                            onDataChange={updateData} 
                            scale={scale}
                        />
                    </div>
                </div>
            </div>

            <SmartFillerMonthly 
                isOpen={isFillerOpen} 
                onClose={() => setIsFillerOpen(false)} 
                onApply={handleSmartFillApply} 
            />
        </div>
    );
}