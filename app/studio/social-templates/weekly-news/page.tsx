// app/studio/social-templates/weekly-news/page.tsx
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useToast } from '@/lib/toastStore';
import { useBodyClass } from '@/hooks/useBodyClass';
import { downloadElementAsImage } from '@/lib/image-export';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklyNewsCanvas from '@/components/studio/social/weekly-news/WeeklyNewsCanvas';
import { WeeklyNewsTemplateData } from '@/components/studio/social/weekly-news/types';
import styles from '@/components/studio/social/SocialEditor.module.css';

const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const ChevronDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>);
const CanvasIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const DEFAULT_DATA: WeeklyNewsTemplateData = {
    weekNumber: `الأسبوع 50`,
    year: `2025`,
    hero: {
        tag: 'خبر عاجل',
        title: 'GTA VI: تفاصيل العرض الثاني',
        subtitle: 'عودة أيقونية لمدينة Vice City',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1080&auto=format&fit=crop',
        imageSettings: { x: 0, y: 0, scale: 1 }
    },
    cards: [
        { id: 1, title: 'Nintendo تؤكد التوافق المسبق', subtitle: 'ودعم تقنيات 4K و DLSS عند الإطلاق', image: 'https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?q=80&w=320&auto=format&fit=crop', imageSettings: { x: 0, y: 0, scale: 1 } },
        { id: 2, title: 'Microsoft تطور جهازاً محمولاً', subtitle: 'مخصصاً لخدمة Game Pass السحابية', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=320&auto=format&fit=crop', imageSettings: { x: 0, y: 0, scale: 1 } },
        { id: 3, title: 'Insomniac تستعرض أسلوب القتال', subtitle: 'الدموي والقصة السوداوية للعبة', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=320&auto=format&fit=crop', imageSettings: { x: 0, y: 0, scale: 1 } }
    ],
    newsList: Array.from({ length: 10 }).map((_, i) => ({
        id: i + 5,
        number: (i + 5).toString().padStart(2, '0'),
        text: i % 2 === 0 
            ? 'CD Projekt Red تؤكد انتهاء مرحلة الإنتاج الأولي لمشروع The Witcher 4'
            : 'Epic Games تمدد موسم Fortnite OG أسبوعين إضافيين بعد طلبات اللاعبين'
    }))
};

export default function WeeklyNewsEditor() {
    useBodyClass('editor-active');
    
    const [data, setData] = useState<WeeklyNewsTemplateData>(DEFAULT_DATA);
    const [scale, setScale] = useState(0.4);
    const [isExporting, startExport] = useTransition();
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    
    const [activeTab, setActiveTab] = useState<'sidebar' | 'canvas'>('canvas');
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

    const handleDownload = (format: 'png' | 'jpeg', quality: number = 0.9) => {
        setIsExportMenuOpen(false);
        startExport(async () => {
            try {
                await downloadElementAsImage('weekly-news-canvas', `weekly-news-${Date.now()}`, format, 2, quality);
                toast.success(`تم التنزيل (${format.toUpperCase()}) - 4K`);
            } catch (e) {
                console.error(e);
                toast.error("فشل التصدير.");
            }
        });
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.mainArea}>
                {(!isMobile || activeTab === 'sidebar') && (
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <h2 className={styles.sidebarTitle}>قالب: النشرة الأسبوعية</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', margin: 0 }}>
                                انقر على النصوص والصور في التصميم لتعديلها مباشرة.
                            </p>
                        </div>
                        
                        <div className={styles.controlGroup}>
                            <div className={styles.downloadGroup}>
                                <button className={styles.downloadButton} onClick={() => handleDownload('jpeg', 0.9)} disabled={isExporting}>
                                    <DownloadIcon />
                                    <span style={{ marginRight: '0.8rem' }}>تحميل 4K (JPG)</span>
                                </button>
                                <button className={styles.dropdownTrigger} onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} disabled={isExporting}>
                                    <motion.div animate={{ rotate: isExportMenuOpen ? 180 : 0 }}>
                                        <ChevronDownIcon />
                                    </motion.div>
                                </button>
                            </div>
                            <AnimatePresence>
                                {isExportMenuOpen && (
                                    <motion.div className={styles.dropdownMenu} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <button className={styles.dropdownItem} onClick={() => handleDownload('png')}>تحميل 4K (PNG)</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>الأسبوع / السنة</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input className={styles.input} value={data.weekNumber} onChange={(e) => setData({ ...data, weekNumber: e.target.value })} />
                                <input className={styles.input} value={data.year} onChange={(e) => setData({ ...data, year: e.target.value })} style={{ width: '80px' }} />
                            </div>
                        </div>

                         <div className={styles.controlGroup} style={{ marginTop: 'auto', opacity: 0.5 }}>
                            <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>التحرير المباشر مفعل على جميع العناصر.</p>
                        </div>
                    </div>
                )}

                {(!isMobile || activeTab === 'canvas') && (
                    <div className={styles.canvasWrapper} ref={canvasWrapperRef}>
                        <div id="weekly-news-canvas-wrapper" style={{ width: 'fit-content', height: 'fit-content' }}>
                             <WeeklyNewsCanvas 
                                data={data} 
                                onChange={(newData) => setData(prev => ({...prev, ...newData}))} 
                                scale={scale}
                            />
                        </div>
                    </div>
                )}
            </div>

            {isMobile && (
                <div className={styles.mobileToggleBar}>
                    <button className={`${styles.mobileToggleButton} ${activeTab === 'sidebar' ? styles.active : ''}`} onClick={() => setActiveTab('sidebar')}>
                        <SettingsIcon />
                        <span>الإعدادات</span>
                    </button>
                    <div className={styles.mobileDivider} />
                    <button className={`${styles.mobileToggleButton} ${activeTab === 'canvas' ? styles.active : ''}`} onClick={() => setActiveTab('canvas')}>
                        <CanvasIcon />
                        <span>التصميم</span>
                    </button>
                </div>
            )}
        </div>
    );
}