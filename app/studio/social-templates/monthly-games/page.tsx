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

const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

const createEmptySlot = (id: number): GameSlotData => ({
    id,
    title: 'عنوان اللعبة',
    day: '01',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    platforms: { PC: true, PS5: false, XSX: false, NSW: false, Cloud: false },
    badges: { gamePass: false, optimized: false, exclusive: false, nintendo: false },
    imageSettings: { x: 0, y: 0, scale: 1 }
});

const DEFAULT_DATA: MonthlyGamesTemplateData = {
    month: 'ألعاب نوفمبر',
    slots: Array.from({ length: 9 }).map((_, i) => createEmptySlot(i))
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

    const handleDownload = (format: 'png' | 'jpeg') => {
        startExport(async () => {
            try {
                await downloadElementAsImage('monthly-games-canvas', `monthly-games-${Date.now()}`, format);
                toast.success(`تم التنزيل (${format.toUpperCase()})`);
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
                        Cloud: false // Default off
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
                            <button className={styles.downloadButton} onClick={() => handleDownload('png')} disabled={isExporting} style={{borderRadius: '8px', borderLeft: 'none'}}>
                                <DownloadIcon />
                                <span style={{ marginRight: '0.8rem' }}>تنزيل (PNG)</span>
                            </button>
                        </div>
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