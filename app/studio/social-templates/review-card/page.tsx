// app/studio/social-templates/review-card/page.tsx
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import ReviewCardCanvas, { ReviewTemplateData } from '@/components/studio/social/ReviewCardCanvas';
import SmartFiller from '@/components/studio/social/SmartFiller';
import styles from '@/components/studio/social/SocialEditor.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadElementAsImage } from '@/lib/image-export';
import { useToast } from '@/lib/toastStore';
import { SparklesIcon } from '@/components/icons';
import { useBodyClass } from '@/hooks/useBodyClass';

// Default Data State
const DEFAULT_DATA: ReviewTemplateData = {
    id: 'default',
    gameTitleAr: 'اسم اللعبة',
    gameTitleEnTop: 'GAME',
    gameTitleEnBottom: 'TITLE',
    score: '0.0',
    rank: 'PENDING',
    status: 'مراجعة',
    verdict: 'اكتب ملخص المراجعة هنا...',
    pros: ['نقطة إيجابية 1', 'نقطة إيجابية 2', 'نقطة إيجابية 3'],
    cons: ['نقطة سلبية 1', 'نقطة سلبية 2'],
    platforms: { PC: true, PS5: false, XSX: false, NSW: false },
    techSpecs: { res: 'RES: 4K', fps: 'FPS: 60', hdr: 'HDR: ON' },
    image: 'https://images.unsplash.com/photo-1614145121029-83a9f7cafd8e?q=80&w=1080&auto=format&fit=crop',
    imageSettings: { x: 0, y: 0, scale: 1 }
};

const ChevronDownIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CanvasIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>;
const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default function ReviewCardEditor() {
    useBodyClass('editor-active');

    const [data, setData] = useState<ReviewTemplateData>(DEFAULT_DATA);
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

    const handleSmartSelect = (item: any) => {
        const arTitle = item.title; 
        let enTop = "GAME"; 
        let enBottom = "TITLE";
        
        const newData: Partial<ReviewTemplateData> = {
            gameTitleAr: arTitle,
            gameTitleEnTop: enTop,
            gameTitleEnBottom: enBottom,
            score: item.score?.toString() || '0.0',
            verdict: item.verdict || 'لا يوجد ملخص...',
            pros: item.pros && item.pros.length > 0 ? item.pros : DEFAULT_DATA.pros,
            cons: item.cons && item.cons.length > 0 ? item.cons : DEFAULT_DATA.cons,
            image: item.imageUrl || DEFAULT_DATA.image,
            imageSettings: { x: 0, y: 0, scale: 1 },
            rank: item.score >= 9 ? 'S-RANK' : (item.score >= 8 ? 'A-RANK' : 'B-RANK'),
            status: item.score >= 9 ? 'أسطوري' : (item.score >= 8 ? 'ممتاز' : 'جيد'),
        };

        setData(prev => ({ ...prev, ...newData }));
        toast.success('تم ملء البيانات.');
        if (isMobile) setActiveTab('canvas');
    };

    const updateData = (newData: Partial<ReviewTemplateData>) => {
        setData(prev => ({ ...prev, ...newData }));
    };

    const handleAddItem = (type: 'pros' | 'cons') => {
        updateData({ [type]: [...data[type], type === 'pros' ? 'إيجابية جديدة' : 'سلبية جديدة'] });
    };

    const handleRemoveItem = (type: 'pros' | 'cons', index: number) => {
        const newList = data[type].filter((_, i) => i !== index);
        updateData({ [type]: newList });
    };

    const handleItemChange = (type: 'pros' | 'cons', index: number, value: string) => {
        const newList = [...data[type]];
        newList[index] = value;
        updateData({ [type]: newList });
    };

    const handleDownload = (format: 'png' | 'jpeg') => {
        setIsExportMenuOpen(false);
        startExport(async () => {
            try {
                await downloadElementAsImage('review-card-canvas', `review-card-${Date.now()}`, format);
                toast.success(`تم التنزيل (${format.toUpperCase()})`);
            } catch (e) {
                console.error(e);
                toast.error("فشل التصدير.");
            }
        });
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.mainArea}>
                {/* Sidebar */}
                {(!isMobile || activeTab === 'sidebar') && (
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                             <h2 className={styles.sidebarTitle}>قالب: بطاقة المراجعة</h2>
                        </div>

                        <div className={styles.controlGroup}>
                            <button className={styles.smartFillButton} onClick={() => setIsFillerOpen(true)}>
                                <SparklesIcon width={20} height={20} />
                                <span>الملء الذكي</span>
                            </button>
                            
                            <div className={styles.downloadGroup}>
                                <button className={styles.downloadButton} onClick={() => handleDownload('png')} disabled={isExporting}>
                                    <DownloadIcon />
                                    <span style={{ marginRight: '0.8rem' }}>تنزيل (PNG)</span>
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
                                        <button className={styles.dropdownItem} onClick={() => handleDownload('jpeg')}>صورة JPG</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.label}>العناوين</label>
                            <input className={styles.input} value={data.gameTitleAr} onChange={e => updateData({ gameTitleAr: e.target.value })} placeholder="الاسم بالعربية" />
                            <input className={styles.input} value={data.gameTitleEnTop} onChange={e => updateData({ gameTitleEnTop: e.target.value })} placeholder="English Top" style={{direction: 'ltr', textAlign: 'left'}} />
                            <input className={styles.input} value={data.gameTitleEnBottom} onChange={e => updateData({ gameTitleEnBottom: e.target.value })} placeholder="English Bottom" style={{direction: 'ltr', textAlign: 'left'}} />
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.label}>التقييم</label>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <input className={styles.input} value={data.score} onChange={e => updateData({ score: e.target.value })} placeholder="9.5" />
                                <input className={styles.input} value={data.rank} onChange={e => updateData({ rank: e.target.value })} placeholder="S-RANK" />
                            </div>
                            <input className={styles.input} value={data.status} onChange={e => updateData({ status: e.target.value })} placeholder="الحالة (مثال: أسطوري)" />
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.label}>الملخص</label>
                            <textarea className={`${styles.input} ${styles.textarea}`} value={data.verdict} onChange={e => updateData({ verdict: e.target.value })} />
                        </div>
                        
                        <div className={styles.controlGroup}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <label className={styles.label}>الإيجابيات</label>
                                <button type="button" onClick={() => handleAddItem('pros')} className="icon-button outline-button" style={{padding: '0.2rem 0.5rem', height: 'auto', fontSize: '1.2rem'}}>
                                    <PlusIcon />
                                </button>
                            </div>
                            {data.pros.map((pro, i) => (
                                <div key={`pro-input-${i}`} style={{display: 'flex', gap: '0.5rem'}}>
                                    <input className={styles.input} value={pro} onChange={e => handleItemChange('pros', i, e.target.value)} />
                                    <button onClick={() => handleRemoveItem('pros', i)} className="icon-button outline-button" style={{color: '#DC2626', borderColor: '#DC2626', height: 'auto'}}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.controlGroup}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <label className={styles.label}>السلبيات</label>
                                <button type="button" onClick={() => handleAddItem('cons')} className="icon-button outline-button" style={{padding: '0.2rem 0.5rem', height: 'auto', fontSize: '1.2rem'}}>
                                    <PlusIcon />
                                </button>
                            </div>
                            {data.cons.map((con, i) => (
                                <div key={`con-input-${i}`} style={{display: 'flex', gap: '0.5rem'}}>
                                    <input className={styles.input} value={con} onChange={e => handleItemChange('cons', i, e.target.value)} />
                                    <button onClick={() => handleRemoveItem('cons', i)} className="icon-button outline-button" style={{color: '#DC2626', borderColor: '#DC2626', height: 'auto'}}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Canvas */}
                {(!isMobile || activeTab === 'canvas') && (
                    <div className={styles.canvasWrapper} ref={canvasWrapperRef}>
                        <div id="review-card-canvas" style={{ width: 'fit-content', height: 'fit-content' }}>
                             <ReviewCardCanvas 
                                data={data} 
                                onDataChange={updateData} 
                                scale={scale}
                            />
                        </div>
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