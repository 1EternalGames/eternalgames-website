// app/studio/analytics/AnalyticsClient.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from './Analytics.module.css';
import gaStyles from './GABlocks.module.css';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import React, { useState, useEffect, useMemo } from 'react';
import { fetchGoogleAnalytics } from './actions';
import { 
    RealtimeBlock, TrendBlock, AcquisitionBlock, 
    GeoBlock, EventsBlock, PagesBlock,
    CyberCard, Header 
} from './GABlocks';

// --- Icons ---
const PageIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const VercelIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>;
const GoogleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.15v2.8h5.4a4.5 4.5 0 1 1-1.9-5.3l2-2a8.5 8.5 0 1 0-2.8 11.3 8.3 8.3 0 0 0 6.45-3.1z"/></svg>;
const ExternalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const CommentIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;

interface AnalyticsData {
    prisma: { users: number; comments: number; engagements: number; shares: number; };
    sanity?: { reviews: number; articles: number; news: number; releases: number; };
}

interface GAData {
    realtime: number;
    trend: any[];
    acquisition: any[];
    pages: any[];
    geo: any[];
    events: any[];
    error?: string;
}

const StatCard = ({ label, value, icon, delay, isLoading = false }: any) => (
    <CyberCard delay={delay} className={styles.miniStatCard}>
        <div className={styles.cardIcon}>{icon}</div>
        <div>
            <div className={styles.cardValue}>
                {isLoading ? <div className="spinner" style={{width: 30, height: 30}} /> : 
                 <AnimatedNumber value={value} isInView={true} className="" />}
            </div>
            <div className={styles.cardLabel}>{label}</div>
        </div>
    </CyberCard>
);

const BarRow = ({ label, value, max, colorClass, delay }: any) => {
    const widthPercent = max > 0 ? (value / max) * 100 : 0;
    return (
        <motion.div className={styles.barRow} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
            <div className={styles.barLabelGroup}>
                <span className={styles.barLabel}>{label}</span>
                <span className={styles.barValue}>{value}</span>
            </div>
            <div className={styles.barTrack}>
                <motion.div className={`${styles.barFill} ${styles[colorClass]}`} initial={{ width: 0 }} animate={{ width: `${widthPercent}%` }} transition={{ duration: 1, delay: delay + 0.2, ease: "circOut" }} />
            </div>
        </motion.div>
    );
};

export default function AnalyticsClient({ data, vercelConfig }: { data: AnalyticsData, vercelConfig: any }) {
    const [gaData, setGaData] = useState<GAData | null>(null);
    const [isGRLoading, setIsGRLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '28d' | '90d'>('28d');

    const sanityData = data.sanity || { reviews: 0, articles: 0, news: 0, releases: 0 };
    const totalContent = sanityData.reviews + sanityData.articles + sanityData.news + sanityData.releases;

    // THE DEFINITIVE FIX: Memoized logic to deduplicate and aggregate page views by title.
    const processedGaData = useMemo(() => {
        if (!gaData || !gaData.pages) return gaData;

        // Use the cleaned TITLE as the key for grouping
        const pageViewsMap = new Map<string, { title: string, path: string, views: number }>();

        gaData.pages.forEach(page => {
            const cleanTitle = page.title.replace(/\| EternalGames/g, '').trim();
            
            if (pageViewsMap.has(cleanTitle)) {
                const existing = pageViewsMap.get(cleanTitle)!;
                // Add the views to the existing entry
                existing.views += page.views;
            } else {
                // Create a new entry with the cleaned title
                pageViewsMap.set(cleanTitle, { ...page, title: cleanTitle });
            }
        });

        const uniquePages = Array.from(pageViewsMap.values()).sort((a, b) => b.views - a.views);

        return { ...gaData, pages: uniquePages };
    }, [gaData]);

    useEffect(() => {
        setIsGRLoading(true);
        fetchGoogleAnalytics(dateRange).then(res => {
            setGaData(res as any);
            setIsGRLoading(false);
        });
    }, [dateRange]);

    const vercelLink = `https://vercel.com/${vercelConfig.teamId ? `${vercelConfig.teamId}/` : ''}${vercelConfig.projectId}/analytics`;
    const googleLink = `https://analytics.google.com/analytics/web/`;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <motion.h1 className={styles.title} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>ديوان البيانات</motion.h1>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {[
                        { k: '7d', l: '7 أيام' },
                        { k: '28d', l: '28 يوم' },
                        { k: '90d', l: '90 يوم' }
                    ].map(({ k, l }) => (
                        <button 
                            key={k}
                            onClick={() => setDateRange(k as any)}
                            className={`${styles.dateBtn} ${dateRange === k ? styles.active : ''}`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </header>

            {gaData?.error && (
                <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid #DC2626', padding: '1.5rem', borderRadius: '8px', marginBottom: '3rem', color: '#ffaaaa', textAlign: 'center', fontSize: '1.4rem' }}>
                    <strong>تنبيه:</strong> {gaData.error}
                </div>
            )}

            {isGRLoading ? (
                <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"/></div>
            ) : processedGaData && !processedGaData.error && (
                <div className={gaStyles.gridContainer}>
                    <RealtimeBlock count={processedGaData.realtime} />
                    <TrendBlock data={processedGaData.trend} />
                    <AcquisitionBlock data={processedGaData.acquisition} />
                    <GeoBlock data={processedGaData.geo} />
                    <PagesBlock data={processedGaData.pages} />
                    <EventsBlock data={processedGaData.events} />
                </div>
            )}

            <h2 className={styles.sectionTitle} style={{textAlign:'center', marginTop:'6rem', marginBottom:'3rem', fontSize:'2.4rem', fontFamily: 'var(--font-heading)'}}>بنية المحتوى</h2>
            
            <div className={styles.grid}>
                 <StatCard label="إجمالي الأرشيف" value={totalContent} icon={<PageIcon />} delay={0.1} />
                 <Link href="/studio/comments" className="no-underline">
                    <StatCard label="التعليقات" value={data.prisma.comments} icon={<CommentIcon />} delay={0.2} />
                </Link>
            </div>

            <div className={`${styles.grid} ${styles.chartsSection}`}>
                <CyberCard className={styles.chartCard} delay={0.3}>
                    <Header title="توزيع البيانات" />
                    <div className={styles.barChart}>
                        <BarRow label="مراجعات" value={sanityData.reviews} max={totalContent} colorClass="reviews" delay={0.4} />
                        <BarRow label="مقالات" value={sanityData.articles} max={totalContent} colorClass="articles" delay={0.5} />
                        <BarRow label="أخبار" value={sanityData.news} max={totalContent} colorClass="news" delay={0.6} />
                        <BarRow label="إصدارات" value={sanityData.releases} max={totalContent} colorClass="releases" delay={0.7} />
                    </div>
                </CyberCard>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <motion.a href={vercelLink} target="_blank" rel="noopener noreferrer" className={`${gaStyles.cyberCard} ${styles.uplinkCard}`}>
                        <div className={styles.logoArea}>
                            <div className={styles.uplinkIcon}><VercelIcon /></div>
                            <div className={styles.uplinkText}><h3>تحليلات Vercel</h3><p>السرعة والأداء</p></div>
                        </div>
                        <div className={styles.uplinkAction}><ExternalIcon /></div>
                    </motion.a>
                    <motion.a href={googleLink} target="_blank" rel="noopener noreferrer" className={`${gaStyles.cyberCard} ${styles.uplinkCard}`}>
                        <div className={styles.logoArea}>
                            <div className={styles.uplinkIcon}><GoogleIcon /></div>
                            <div className={styles.uplinkText}><h3>تحليلات Google</h3><p>البيانات الكاملة</p></div>
                        </div>
                        <div className={styles.uplinkAction}><ExternalIcon /></div>
                    </motion.a>
                </div>
            </div>
        </div>
    );
}