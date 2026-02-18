// app/studio/analytics/GABlocks.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
    BarChart, Bar, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GABlocks.module.css';

// --- Translation Maps ---
const EVENT_TRANSLATIONS: Record<string, string> = {
    'page_view': 'مشاهدة صفحة',
    'user_engagement': 'تفاعل نشط',
    'session_start': 'جلسة جديدة',
    'scroll': 'تصفح (تمرير)',
    'first_visit': 'زيارة لأول مرة',
    'form_start': 'بدء نموذج',
    'click': 'نقر',
    'view_search_results': 'نتائج بحث',
    'file_download': 'تحميل ملف',
    'video_start': 'تشغيل فيديو'
};

const CHANNEL_TRANSLATIONS: Record<string, string> = {
    'Direct': 'مباشر',
    'Organic Search': 'بحث عضوي',
    'Social': 'تواصل اجتماعي',
    'Organic Social': 'تواصل اجتماعي',
    'Referral': 'إحالة',
    'Email': 'بريد إلكتروني',
    'Paid Search': 'بحث مدفوع',
    '(Other)': 'أخرى',
    'Unassigned': 'غير مصنف'
};

const translateEvent = (name: string) => EVENT_TRANSLATIONS[name] || name;
const translateChannel = (name: string) => CHANNEL_TRANSLATIONS[name] || name;


// --- Shared Components ---

export const CyberCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            mouseX.current = e.clientX - rect.left;
            mouseY.current = e.clientY - rect.top;
            cardRef.current.style.setProperty('--mouse-x', `${mouseX.current}px`);
            cardRef.current.style.setProperty('--mouse-y', `${mouseY.current}px`);
        }
    };

    return (
        <motion.div 
            ref={cardRef}
            className={`${styles.cyberCard} ${className || ''}`}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={handleMouseMove}
        >
            <div className={styles.glowSpot} style={{ top: 'var(--mouse-y)', left: 'var(--mouse-x)' }} />
            {children}
        </motion.div>
    );
};

export const Header = ({ title }: { title: string }) => (
    <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
            <span style={{ color: 'var(--accent)' }}>//</span> {title}
        </div>
        <div className={styles.headerDecor}>
            <div className={styles.headerDot} />
            <div className={styles.headerDot} />
            <div className={styles.headerDot} />
        </div>
    </div>
);

// --- 1. Realtime Heartbeat ---
export const RealtimeBlock = ({ count }: { count: number }) => {
    const isActive = count > 0;
    const ecgData = Array.from({ length: 40 }).map((_, i) => ({ val: isActive ? (Math.random() > 0.9 ? Math.random() * 50 : Math.random() * 10) : 2 }));

    return (
        <CyberCard className={styles.realtimeCard} delay={0}>
            <Header title="حالة النظام" />
            <div className={styles.pulseContainer}>
                <div className={styles.hudRing} style={{ borderStyle: 'solid', borderWidth: '2px', borderColor: 'rgba(0,255,240,0.1)', width: '180px', height: '180px', animationDuration: isActive ? '30s' : '60s', animationDirection: 'reverse', opacity: 0.5 }} />
                {isActive && <div className={styles.hudRing} />}
                <div className={styles.hudRing} style={{ width: '100px', height: '100px', animationDuration: '10s', borderStyle: 'dotted', opacity: isActive ? 1 : 0.3 }} />
                <motion.div className={styles.realtimeValue} key={count} initial={{ scale: 1.2, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 10 }} style={{ color: isActive ? '#fff' : '#555', textShadow: isActive ? '0 0 20px rgba(0, 255, 240, 0.4)' : 'none' }}>
                    {count}
                </motion.div>
            </div>
            <div className={styles.liveBadge}>
                <span style={{ color: isActive ? 'var(--accent)' : '#555', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isActive ? 'var(--accent)' : '#555', boxShadow: isActive ? '0 0 10px var(--accent)' : 'none' }} />
                    {isActive ? 'زوار نشطون الآن' : 'لا يوجد نشاط'}
                </span>
                <span style={{ color: '#fff', opacity: 0.7 }}>{isActive ? 'متصل' : 'خامل'}</span>
            </div>
            <div className={styles.ecgLine}>
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={ecgData}><Area type="step" dataKey="val" stroke={isActive ? "var(--accent)" : "#333"} fill="none" strokeWidth={1} strokeOpacity={0.3} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
            </div>
        </CyberCard>
    );
};

// --- 2. Trend Stream (Translated) ---
export const TrendBlock = ({ data }: { data: any[] }) => (
    <CyberCard className={styles.trendCard} delay={0.1}>
        <Header title="تدفق الزيارات" />
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00FFF0" stopOpacity={0.4}/><stop offset="95%" stopColor="#00FFF0" stopOpacity={0}/></linearGradient>
                        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/></pattern>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', border: '1px solid var(--accent)', borderRadius: '8px', backdropFilter: 'blur(10px)', direction: 'rtl', textAlign: 'right' }} itemStyle={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--font-main)' }} labelStyle={{ color: 'var(--accent)', marginBottom: '0.5rem', fontFamily: 'monospace' }} cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '5 5' }} formatter={(value: any, name: any) => [value, name === 'users' ? 'المستخدمون' : 'الجلسات']} />
                    <Area type="monotone" dataKey="users" stroke="#00FFF0" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" animationDuration={1500} />
                    <Area type="monotone" dataKey="sessions" stroke="#8B5CF6" strokeWidth={2} fill="none" strokeOpacity={0.5} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </CyberCard>
);

// --- 3. Acquisition (Translated) ---
export const AcquisitionBlock = ({ data }: { data: any[] }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <CyberCard className={styles.acquisitionCard} delay={0.2}>
            <Header title="قوة الإشارة: المصادر" />
            <div style={{ marginTop: '1rem' }}>
                {data.map((item, i) => (
                    <div key={i} className={styles.powerRow}>
                        <div className={styles.powerHeader}>
                            <span>{translateChannel(item.name)}</span>
                            <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{item.value}</span>
                        </div>
                        <div className={styles.powerTrack}>
                            <motion.div className={styles.powerFill} initial={{ width: 0 }} animate={{ width: `${(item.value / maxVal) * 100}%` }} transition={{ duration: 1, delay: 0.5 + (i * 0.1), ease: "circOut" }} />
                        </div>
                    </div>
                ))}
            </div>
        </CyberCard>
    );
};

// --- 4. Geo (Translated & Expandable) ---
export const GeoBlock = ({ data }: { data: any[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <CyberCard className={styles.geoCard} delay={0.3}>
            <Header title="العقد الجغرافية" />
            <div className={styles.geoLayout}>
                <div className={styles.radarContainer}>
                    <div className={styles.radarCircle} style={{ width: '100%', height: '100%' }} />
                    <div className={styles.radarCircle} style={{ width: '66%', height: '66%' }} />
                    <div className={styles.radarCircle} style={{ width: '33%', height: '33%' }} />
                    <div className={styles.radarSweep} />
                    {data.slice(0, 5).map((d, i) => <motion.div key={i} style={{ position: 'absolute', width: '6px', height: '6px', background: '#fff', borderRadius: '50%', top: `${50 + Math.random() * 60 - 30}%`, left: `${50 + Math.random() * 60 - 30}%`, boxShadow: '0 0 10px var(--accent)' }} animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} /> )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={`${styles.countryList} ${isExpanded ? styles.expanded : ''}`}>
                        {(isExpanded ? data : data.slice(0, 7)).map((c, i) => (
                            <div key={i} className={styles.countryRow}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'monospace' }}>{(i+1).toString().padStart(2, '0')}</span>{c.country}</span>
                                <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{c.users}</span>
                            </div>
                        ))}
                    </div>
                    {data.length > 7 && <button onClick={() => setIsExpanded(!isExpanded)} className={styles.expandButton}>{isExpanded ? 'عرض أقل' : 'عرض الكل'}</button>}
                </div>
            </div>
        </CyberCard>
    );
};

// --- 5. Events (Translated & Expandable) ---
export const EventsBlock = ({ data }: { data: any[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <CyberCard className={styles.listCard} delay={0.4}>
            <Header title="سجل الأحداث" />
            <div className={`${styles.terminalList} ${isExpanded ? styles.expanded : ''}`}>
                {(isExpanded ? data : data.slice(0, 7)).map((item, i) => (
                    <motion.div key={i} className={styles.terminalItem} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.05) }}>
                        <span>{translateEvent(item.name)}</span>
                        <span className={styles.terminalValue}>{item.count}</span>
                    </motion.div>
                ))}
            </div>
            {data.length > 7 && <button onClick={() => setIsExpanded(!isExpanded)} className={styles.expandButton}>{isExpanded ? 'عرض أقل' : 'عرض الكل'}</button>}
        </CyberCard>
    );
};

// --- 6. Pages (Translated & Expandable) ---
export const PagesBlock = ({ data }: { data: any[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <CyberCard className={styles.listCard} delay={0.5}>
            <Header title="القطاعات النشطة" />
            <div className={`${styles.terminalList} ${isExpanded ? styles.expanded : ''}`}>
                {(isExpanded ? data : data.slice(0, 7)).map((item, i) => (
                    <motion.div key={i} className={styles.terminalItem} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.05) }}>
                        <span style={{ maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'rtl' }}>{item.title.replace(' | EternalGames', '')}</span>
                        <span className={styles.terminalValue}>{item.views}</span>
                    </motion.div>
                ))}
            </div>
            {data.length > 7 && <button onClick={() => setIsExpanded(!isExpanded)} className={styles.expandButton}>{isExpanded ? 'عرض أقل' : 'عرض الكل'}</button>}
        </CyberCard>
    );
};