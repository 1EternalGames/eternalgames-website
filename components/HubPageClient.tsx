// components/HubPageClient.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import HubFilters, { HubTypeFilter, HubSortOrder } from './HubFilters';
import ArticleCard from './ArticleCard';
import { useEngagementScores } from '@/hooks/useEngagementScores';
import Image from 'next/image';
import { adaptToCardProps } from '@/lib/adapters';
import { urlFor } from '@/sanity/lib/image';
import styles from './HubPage.module.css';

interface HubPageClientProps {
    initialItems: any[];
    hubTitle: string;
    hubType: 'اللعبة' | 'وسم' | 'أعمال';
    headerAction?: React.ReactNode;
}

export default function HubPageClient({ initialItems, hubTitle, hubType, headerAction }: HubPageClientProps) {
    const [activeTypeFilter, setActiveTypeFilter] = useState<HubTypeFilter>('all');
    const [activeSort, setActiveSort] = useState<HubSortOrder>('latest');
    const engagementScores = useEngagementScores();
    const contentRef = useRef(null);
    const isInView = useInView(contentRef, { once: true, amount: 0.1 });

    const latestItem = useMemo(() => {
        if (initialItems && initialItems.length > 0) {
            return initialItems[0];
        }
        return null;
    }, [initialItems]);

    const heroImageUrl = latestItem?.mainImageRef 
        ? urlFor(latestItem.mainImageRef).width(1920).quality(80).auto('format').url() 
        : null;
    const heroBlurDataURL = latestItem?.mainImageRef 
        ? urlFor(latestItem.mainImageRef).width(20).blur(10).quality(30).auto('format').url()
        : null;

    const filteredAndSortedItems = useMemo(() => {
        const scoresMap = new Map(engagementScores.map(s => [s.id, s.engagementScore]));
        let items = initialItems;
        if (activeTypeFilter !== 'all') {
            items = items.filter(item => item._type === activeTypeFilter);
        }
        if (activeSort === 'viral') {
            items.sort((a, b) => {
                const scoreA = scoresMap.get(a.legacyId) || 0;
                const scoreB = scoresMap.get(b.legacyId) || 0;
                return scoreB - scoreA;
            });
        }
        return items.map(adaptToCardProps).filter(Boolean);
    }, [initialItems, activeTypeFilter, activeSort, engagementScores]);
    
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

    return (
        <div className={styles.hubPageContainer}>
            {heroContent}
            <div ref={contentRef} className="container" style={{paddingTop: '4rem'}}>
                 <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <HubFilters
                        activeTypeFilter={activeTypeFilter}
                        onTypeFilterChange={setActiveTypeFilter}
                        activeSort={activeSort}
                        onSortChange={setActiveSort}
                    />
                </motion.div>
                
                <motion.div layout className="content-grid" style={{ paddingBottom: '6rem' }}>
                    <AnimatePresence>
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                                    style={{ height: '100%' }}
                                >
                                    <ArticleCard
                                        article={item}
                                        isArticle={item.type === 'article'}
                                        layoutIdPrefix={`${hubType}-${hubTitle}`}
                                    />
                                </motion.div>
                            ))
                        ) : (
                             <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}}
                            >
                                No content found matching your filters.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}


