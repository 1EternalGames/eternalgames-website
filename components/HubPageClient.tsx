// components/HubPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import HubFilters, { HubTypeFilter, HubSortOrder } from './HubFilters';
import ArticleCard from './ArticleCard';
import Image from 'next/image';
import { adaptToCardProps } from '@/lib/adapters';
import { urlFor } from '@/sanity/lib/image';
import styles from './HubPage.module.css';
import { CardProps, EngagementScore } from '@/types';

interface HubPageClientProps {
    initialItems: any[];
    hubTitle: string;
    hubType: 'اللعبة' | 'وسم' | 'أعمال';
    headerAction?: React.ReactNode;
}

export default function HubPageClient({ initialItems, hubTitle, hubType, headerAction }: HubPageClientProps) {
    if (!initialItems || initialItems.length === 0) {
        return (
            <div className="container page-container">
                <h1 className="page-title">{hubType}: &quot;{hubTitle}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.8rem', maxWidth: '600px', margin: '0 auto'}}>
                    لم يُنشر أي محتوى يطابق هذا المحور بعد. الأرشيف يترقب المستجدات.
                </p>
            </div>
        );
    }
    
    const [activeTypeFilter, setActiveTypeFilter] = useState<HubTypeFilter>('all');
    const [activeSort, setActiveSort] = useState<HubSortOrder>('latest');
    const [engagementScores, setEngagementScores] = useState<Map<number, number>>(new Map());
    const contentRef = useRef(null);
    const isInView = useInView(contentRef, { once: true, amount: 0.1 });

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch('/api/engagement-scores');
                const data: EngagementScore[] = await res.json();
                const scoresMap = new Map(data.map(score => [score.id, score.engagementScore]));
                setEngagementScores(scoresMap);
            } catch (error) {
                console.error("Failed to fetch engagement scores for Hub Page:", error);
            }
        };
        if (activeSort === 'viral') {
            fetchScores();
        }
    }, [activeSort]);

    // THE FIX: Wrap in arrow function and apply width optimization
    const adaptedInitialItems = useMemo(() => 
        (initialItems || [])
            .map(item => adaptToCardProps(item, { width: 600 }))
            .filter(Boolean) as CardProps[],
        [initialItems]
    );

    const filteredAndSortedItems = useMemo(() => {
        let items = [...adaptedInitialItems];

        if (activeTypeFilter !== 'all') {
            items = items.filter(item => item.type === activeTypeFilter);
        }

        if (activeSort === 'viral') {
            items.sort((a, b) => {
                const scoreA = engagementScores.get(a.legacyId) || 0;
                const scoreB = engagementScores.get(b.legacyId) || 0;
                return scoreB - scoreA;
            });
        }
        
        return items;
    }, [adaptedInitialItems, activeTypeFilter, activeSort, engagementScores]);

    const latestItem = useMemo(() => {
        if (initialItems && initialItems.length > 0) {
            return initialItems[0];
        }
        return null;
    }, [initialItems]);

    const heroImageUrl = latestItem?.mainImageRef 
        ? urlFor(latestItem.mainImageRef).width(1920).auto('format').url() 
        : null;
    const heroBlurDataURL = latestItem?.mainImageRef 
        ? urlFor(latestItem.mainImageRef).width(20).blur(10).auto('format').url()
        : null;
    
    const heroContent = (
        <div className={styles.hubHero} style={{ height: heroImageUrl ? '40vh' : 'auto', marginBottom: heroImageUrl ? '-8rem' : '0', paddingTop: heroImageUrl ? '0' : `calc(var(--nav-height-scrolled) + 4rem)`}}>
            {heroImageUrl && (
                <>
                    <Image 
                        src={heroImageUrl} 
                        alt={`Background for ${hubTitle}`} 
                        fill 
                        className={styles.heroBg}
                        style={{ objectFit: 'cover' }} 
                        priority 
                        placeholder={heroBlurDataURL ? 'blur' : 'empty'}
                        blurDataURL={heroBlurDataURL || ''}
                    />
                    <div className={styles.heroOverlay} />
                </>
            )}
            <motion.div 
                className="container"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', zIndex: 5 }}
                initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}
            >
                {headerAction}
                <h1 className={`${styles.heroTitle} page-title`} style={{margin: 0}}>
                    {hubType}<span>: &quot;{hubTitle}&quot;</span>
                </h1>
            </motion.div>
        </div>
    );

    const layoutIdPrefix = `hub-${hubType}-${hubTitle.replace(/\s+/g, '-')}`;

    return (
        <div className={styles.hubPageContainer}>
            {heroContent}
            <div ref={contentRef} className="container" style={{paddingTop: '4rem'}}>
                 <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: "easeOut" as const }}
                >
                    <HubFilters
                        activeTypeFilter={activeTypeFilter}
                        onTypeFilterChange={setActiveTypeFilter}
                        activeSort={activeSort}
                        onSortChange={setActiveSort}
                    />
                </motion.div>
                
                <motion.div 
                    layout 
                    className="content-grid" 
                    style={{ paddingBottom: '6rem' }}
                >
                    <AnimatePresence>
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring' as const, stiffness: 250, damping: 25 }}
                                    style={{ height: '100%' }}
                                >
                                    <ArticleCard
                                        article={item}
                                        layoutIdPrefix={layoutIdPrefix}
                                    />
                                </motion.div>
                            ))
                        ) : (
                                <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}}
                            >
                                لا يوجد محتوى يطابق بحثك.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}