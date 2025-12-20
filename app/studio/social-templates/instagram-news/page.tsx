// app/studio/social-templates/instagram-news/page.tsx
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import InstagramNewsCanvas, { TemplateData } from '@/components/studio/social/InstagramNewsCanvas';
import SmartFiller from '@/components/studio/social/SmartFiller';
import styles from '@/components/studio/social/SocialEditor.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadElementAsImage } from '@/lib/image-export';
import { useToast } from '@/lib/toastStore';
import { SparklesIcon } from '@/components/icons';
import { smartSplitText } from '@/lib/text-utils';
import { useBodyClass } from '@/hooks/useBodyClass';

// Use the type exported from the component to ensure consistency
type SlideData = TemplateData & { id: string };

const DEFAULT_SLIDE: SlideData = {
    id: 'default',
    titleTop: 'عنوان الخبر',
    titleBottom: 'تفاصيل إضافية',
    subTitle: '',
    body: 'نص الخبر يظهر هنا. يمكنك النقر على زر "الملء الذكي" لجلب البيانات من المقالات والأخبار الموجودة على الموقع مباشرة.',
    source: 'المصدر: EternalGames',
    image: 'https://images.unsplash.com/photo-1614145121029-83a9f7cafd8e?q=80&w=1080&auto=format&fit=crop',
    imageSettings: { x: 0, y: 0, scale: 1 },
    type: 'official',
    footerHandle: '@ETERNALGAMES_NET'
};

const ChevronDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
);
const ArrowLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>;
const ArrowRightIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CanvasIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>;
const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

export default function InstagramNewsEditor() {
    useBodyClass('editor-active');

    const [slides, setSlides] = useState<SlideData[]>([{ ...DEFAULT_SLIDE, id: crypto.randomUUID() }]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    
    const [scale, setScale] = useState(0.4);
    const [isFillerOpen, setIsFillerOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isExporting, startExport] = useTransition();
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
            // Maximize space: small padding
            const padding = 40; 
            const availableWidth = width - padding;
            const availableHeight = height - padding;
            
            const scaleX = availableWidth / 1080;
            const scaleY = availableHeight / 1350;
            
            const cap = isMobile ? 1 : 0.95;
            const newScale = Math.min(scaleX, scaleY, cap);
            setScale(newScale);
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });
        
        resizeObserver.observe(canvasWrapperRef.current);
        updateScale(); 

        return () => resizeObserver.disconnect();
    }, [isMobile]);

    const handleSmartSelect = (item: any) => {
        let type: 'official' | 'rumor' | 'leak' = 'official';
        if (item.newsType) type = item.newsType; 
        
        const words = item.title.split(' ');
        const mid = Math.ceil(words.length / 2);
        const top = words.slice(0, mid).join(' ');
        const bottom = words.slice(mid).join(' ');

        let fullBodyText = "";
        if (item._type === 'review') {
            const parts = [];
            if (item.verdict) parts.push(`الخلاصة: ${item.verdict}`);
            if (item.score) parts.push(`التقييم: ${item.score}/10`);
            if (item.pros && item.pros.length > 0) parts.push(`\nالمحاسن:\n+ ${item.pros.slice(0, 2).join('\n+ ')}`);
            if (item.cons && item.cons.length > 0) parts.push(`\nالمساوئ:\n- ${item.cons.slice(0, 2).join('\n- ')}`);
            fullBodyText = parts.join('\n\n');
        } else if (item._type === 'gameRelease') {
            fullBodyText = item.synopsis || "";
        } else {
            fullBodyText = item.excerpt || "";
            if (!fullBodyText && item.synopsis) fullBodyText = item.synopsis;
        }

        if (!fullBodyText.trim()) fullBodyText = item.title;

        const textChunks = smartSplitText(fullBodyText, 350);
        
        const newSlides = textChunks.map((chunk) => ({
            id: crypto.randomUUID(),
            titleTop: top || item.title,
            titleBottom: bottom || '',
            subTitle: '',
            body: chunk,
            image: item.imageUrl || DEFAULT_SLIDE.image,
            imageSettings: { x: 0, y: 0, scale: 1 },
            type: type,
            source: item.gameTitle ? `المصدر: ${item.gameTitle}` : (item._type === 'review' ? 'مراجعة: EternalGames' : 'المصدر: خاص'),
            footerHandle: DEFAULT_SLIDE.footerHandle
        }));

        setSlides(newSlides);
        setCurrentSlideIndex(0);
        toast.success(`تم إنشاء ${newSlides.length} شرائح.`);
        
        if (isMobile) setActiveTab('canvas');
    };

    const updateCurrentSlide = (newData: Partial<SlideData>) => {
        setSlides(prev => {
            const newSlides = [...prev];
            newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], ...newData };
            return newSlides;
        });
    };

    const handleAddSlide = () => {
        const currentSlide = slides[currentSlideIndex];
        const newSlide: SlideData = { 
            ...currentSlide, 
            id: crypto.randomUUID(),
            body: 'نص الشريحة الجديدة...',
            imageSettings: { ...currentSlide.imageSettings! }
        };
        
        const newSlides = [...slides];
        newSlides.splice(currentSlideIndex + 1, 0, newSlide);
        setSlides(newSlides);
        setCurrentSlideIndex(currentSlideIndex + 1);
    };

    const handleDeleteSlide = () => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter((_, i) => i !== currentSlideIndex);
        setSlides(newSlides);
        if (currentSlideIndex >= newSlides.length) {
            setCurrentSlideIndex(newSlides.length - 1);
        }
    };

    const handleDownload = (format: 'png' | 'jpeg', quality: number = 0.9) => {
        setIsExportMenuOpen(false);
        startExport(async () => {
            try {
                // MODIFIED: 2x scale for 4K
                await downloadElementAsImage('instagram-news-canvas', `ig-news-${Date.now()}`, format, 2, quality);
                toast.success(`تم التنزيل (${format.toUpperCase()}) - 4K`);
            } catch (e) {
                console.error(e);
                toast.error("فشل التصدير.");
            }
        });
    };

    const currentSlide = slides[currentSlideIndex];

    return (
        <div className={styles.editorContainer}>
            <div className={styles.mainArea}>
                {/* Sidebar Controls */}
                {(!isMobile || activeTab === 'sidebar') && (
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                             <h2 className={styles.sidebarTitle}>قالب: خبر Instagram</h2>
                        </div>

                        <div className={styles.controlGroup}>
                            <button className={styles.smartFillButton} onClick={() => setIsFillerOpen(true)}>
                                <SparklesIcon width={20} height={20} />
                                <span>الملء الذكي</span>
                            </button>
                            
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className={styles.label}>الشرائح (Slides)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="icon-button outline-button" onClick={handleAddSlide} title="إضافة" style={{ padding: '0.5rem 1rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
                                        <PlusIcon />
                                        <span>إضافة</span>
                                    </button>
                                    {slides.length > 1 && (
                                        <button className="icon-button outline-button" onClick={handleDeleteSlide} title="حذف" style={{ padding: '0.5rem', height: 'auto', color: '#DC2626', borderColor: '#DC2626' }}>
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <button className="icon-button" onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} style={{ opacity: currentSlideIndex === 0 ? 0.3 : 1 }}>
                                    <ArrowRightIcon />
                                </button>
                                <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>{currentSlideIndex + 1} / {slides.length}</span>
                                <button className="icon-button" onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === slides.length - 1} style={{ opacity: currentSlideIndex === slides.length - 1 ? 0.3 : 1 }}>
                                    <ArrowLeftIcon />
                                </button>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.label}>التصنيف</label>
                            <div className={styles.typeGrid}>
                                {['official', 'rumor', 'leak'].map(t => (
                                    <button key={t} className={`${styles.typeButton} ${currentSlide.type === t ? styles.active : ''}`} onClick={() => updateCurrentSlide({ type: t as any })} data-type={t}>
                                        {t === 'official' ? 'رسمي' : t === 'rumor' ? 'إشاعة' : 'تسريب'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>العنوان الرئيسي</label>
                            <input className={styles.input} value={currentSlide.titleTop} onChange={e => updateCurrentSlide({ titleTop: e.target.value })} />
                        </div>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>العنوان الفرعي</label>
                            <input className={styles.input} value={currentSlide.titleBottom} onChange={e => updateCurrentSlide({ titleBottom: e.target.value })} />
                        </div>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>النص (محرر ذكي متاح في المعاينة)</label>
                            {/* NOTE: Text area removed here since editing is done in-canvas */}
                            <div className={styles.input} style={{opacity: 0.7, fontSize: '1.2rem'}}>اضغط على النص في التصميم للتعديل</div>
                        </div>
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>المصدر</label>
                            <input className={styles.input} value={currentSlide.source} onChange={e => updateCurrentSlide({ source: e.target.value })} />
                        </div>
                    </div>
                )}

                {/* Main Canvas Area */}
                {(!isMobile || activeTab === 'canvas') && (
                    <div className={styles.canvasWrapper} ref={canvasWrapperRef}>
                        <InstagramNewsCanvas 
                            data={currentSlide}
                            onDataChange={updateCurrentSlide}
                            scale={scale} 
                            currentSlide={currentSlideIndex}
                            totalSlides={slides.length}
                        />
                    </div>
                )}
            </div>

            {/* Mobile Tabs */}
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

            <SmartFiller isOpen={isFillerOpen} onClose={() => setIsFillerOpen(false)} onSelect={handleSmartSelect} />
        </div>
    );
}


