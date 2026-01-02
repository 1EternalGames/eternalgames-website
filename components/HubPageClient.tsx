// components/HubPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect, useLayoutEffect, RefObject } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import HubFilters, { HubTypeFilter, HubSortOrder } from './HubFilters';
import ArticleCard from './ArticleCard';
import Image from 'next/image';
import Link from 'next/link';
import { adaptToCardProps } from '@/lib/adapters';
import { urlFor } from '@/sanity/lib/image';
import styles from './HubPage.module.css';
import { CardProps, EngagementScore } from '@/types';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { sanityLoader } from '@/lib/sanity.loader'; 
import { translateTag } from '@/lib/translations';

import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';
import KineticLink from '@/components/kinetic/KineticLink'; 
import ArticleCardSkeleton from '@/components/ui/ArticleCardSkeleton';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface HubPageClientProps {
    initialItems: any[];
    hubTitle: string;
    hubType: 'اللعبة' | 'وسم' | 'أعمال';
    headerAction?: React.ReactNode;
    synopsis?: string | null;      
    tags?: { title: string, slug?: string }[];    
    fallbackImage?: any; 
    price?: string;
    developer?: string;
    publisher?: string;
    platforms?: string[];
    onGamePass?: boolean;
    onPSPlus?: boolean;
    scrollContainerRef?: RefObject<HTMLElement | null>;
    isLoading?: boolean; 
}

const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'PC': PCIcon,
    'PlayStation': PS5Icon, 'PlayStation 5': PS5Icon,
    'Xbox': XboxIcon,
    'Switch': SwitchIcon,
};

const formatSynopsis = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, i) => {
        if (/^[A-Za-z0-9]+$/.test(part.replace(/[^\w\s]/gi, ''))) {
            return <strong key={i} style={{fontWeight: 800}}>{part}</strong>;
        }
        return part;
    });
};

const MetadataDivider = () => (
    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />
);

export default function HubPageClient({ 
    initialItems, hubTitle, hubType, headerAction, synopsis, tags, fallbackImage,
    price, developer, publisher, platforms, onGamePass, onPSPlus,
    scrollContainerRef,
    isLoading = false 
}: HubPageClientProps) {
    const { prefix: layoutIdPrefix, setPrefix } = useLayoutIdStore();
    
    // Removed isGridReady logic

    useIsomorphicLayoutEffect(() => { 
        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTop = 0;
        } else {
            window.scrollTo(0, 0); 
        }
    }, [scrollContainerRef]);

    useEffect(() => {
        return () => setPrefix('default');
    }, [setPrefix]);
    
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

    const latestItem = (initialItems && initialItems.length > 0) ? initialItems[0] : null;
    
    let heroImageRef = latestItem?.mainImageRef || fallbackImage;
    if (hubType === 'اللعبة' && fallbackImage) {
        heroImageRef = fallbackImage;
    }

    let heroImageUrl = '/placeholder.svg';
    let heroBlurDataURL = null;
    let isExternalImage = false;

    try {
        if (typeof heroImageRef === 'string') {
            if (heroImageRef.startsWith('http') || heroImageRef.startsWith('/')) {
                heroImageUrl = heroImageRef;
                isExternalImage = true;
            }
        } else if (heroImageRef && (heroImageRef.asset || heroImageRef._ref || heroImageRef._id)) {
             heroImageUrl = urlFor(heroImageRef).width(1920).auto('format').url();
             heroBlurDataURL = urlFor(heroImageRef).width(20).blur(10).auto('format').url();
        }
    } catch (e) {
        console.warn("HubPageClient: Failed to resolve hero image", e);
        heroImageUrl = '/placeholder-game.svg';
    }
    
    const heroLayoutId = layoutIdPrefix === 'default' 
        ? `hub-hero-${hubTitle.replace(/\s+/g, '-')}` 
        : `${layoutIdPrefix}-image`;

    const synopsisContent = useMemo(() => {
        if (!synopsis) return null;
        const [firstWord, ...rest] = synopsis.split(' ');
        const restText = rest.join(' ');
        return (
            <p className={styles.synopsis}>
                <span className={styles.synopsisFirstWord}>{firstWord}</span>
                {' '}
                {formatSynopsis(restText)}
            </p>
        );
    }, [synopsis]);

    const heroContent = (
        <motion.div 
            className={styles.hubHero} 
            layoutId={`${layoutIdPrefix}-container`}
        >
            <motion.div 
                className={styles.heroBg}
                layoutId={heroLayoutId}
                style={{ position: 'absolute', inset: 0, zIndex: -2 }}
            >
                <Image 
                    loader={sanityLoader}
                    src={heroImageUrl} 
                    alt={`Background for ${hubTitle}`} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                    priority 
                    placeholder={heroBlurDataURL ? 'blur' : 'empty'}
                    blurDataURL={heroBlurDataURL || ''}
                    unoptimized={isExternalImage} 
                />
            </motion.div>
            <div className={styles.heroOverlay} />
            
            <motion.div 
                className={`container ${styles.heroContentContainer}`}
                initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}}
            >
                {headerAction}
                <motion.h1 
                    className={`${styles.heroTitle} page-title`} 
                    style={{margin: 0}}
                    layoutId={`${layoutIdPrefix}-title`}
                >
                    {hubType}<span>: &quot;{hubTitle}&quot;</span>
                </motion.h1>
                
                {synopsisContent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        {synopsisContent}
                    </motion.div>
                )}
                
                <motion.div 
                    className={styles.metadataRow}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {price && <div className={`${styles.hubPill} ${styles.price}`}>{price}</div>}
                    
                    {onGamePass && (
                        <div className={`${styles.hubPill} ${styles.platform}`} style={{ borderColor: '#10B981', color: '#10B981' }}>
                            <XboxIcon style={{ width: 14, height: 14 }} />
                            <span>Game Pass</span>
                        </div>
                    )}
                    
                    {onPSPlus && (
                        <div className={`${styles.hubPill} ${styles.platform}`} style={{ borderColor: '#3B82F6', color: '#3B82F6' }}>
                            <PS5Icon style={{ width: 16, height: 16 }} />
                            <span>PS Plus</span>
                        </div>
                    )}
                    
                    {price && (developer || publisher) && <MetadataDivider />}

                    {developer && (
                        <Link 
                            href={`/developers/${developer.toLowerCase().replace(/\s+/g, '-')}`} 
                            className={`${styles.hubPill} ${styles.dev} ${styles.interactive}`}
                            prefetch={false}
                        >
                            {developer}
                        </Link>
                    )}
                    
                    {publisher && publisher !== developer && (
                        <Link 
                            href={`/publishers/${publisher.toLowerCase().replace(/\s+/g, '-')}`} 
                            className={`${styles.hubPill} ${styles.dev} ${styles.interactive}`}
                            prefetch={false}
                        >
                            {publisher}
                        </Link>
                    )}

                    {(developer || publisher) && platforms && platforms.length > 0 && <MetadataDivider />}

                    {platforms && platforms.map(p => {
                        const Icon = PlatformIcons[p];
                        if (!Icon) return null;
                        return (
                            <div key={p} className={`${styles.hubPill} ${styles.platform}`}>
                                <Icon style={{ width: 16, height: 16 }} />
                                <span>{p === 'PlayStation' || p === 'PlayStation 5' ? 'PS5' : p}</span>
                            </div>
                        );
                    })}

                    {platforms && platforms.length > 0 && tags && tags.length > 0 && <MetadataDivider />}

                     {tags && tags.map(t => (
                        <KineticLink 
                            key={t.title} 
                            href={t.slug ? `/tags/${t.slug}` : '#'}
                            slug={t.slug || ''}
                            type="tags"
                            className={`${styles.hubPill} ${styles.genre} ${styles.interactive}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {translateTag(t.title)}
                        </KineticLink>
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    );

    const listLayoutIdPrefix = `hub-${hubType}-${hubTitle.replace(/\s+/g, '-')}`;

    return (
        <div className={styles.hubPageContainer}>
            {heroContent}
            <div ref={contentRef} className="container" style={{paddingTop: '4rem'}}>
                 
                     {isLoading ? (
                         <div className="content-grid gpu-cull">
                             <ArticleCardSkeleton variant="default" />
                             <ArticleCardSkeleton variant="default" />
                             <ArticleCardSkeleton variant="default" />
                             <ArticleCardSkeleton variant="default" />
                         </div>
                     ) : (
                         initialItems && initialItems.length > 0 ? (
                            <>
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
                                
                                {/* REMOVED: layout prop */}
                                <div 
                                    className="content-grid gpu-cull"
                                    style={{ paddingBottom: '6rem' }}
                                >
                                    <AnimatePresence>
                                        {filteredAndSortedItems.length > 0 ? (
                                            filteredAndSortedItems.map(item => (
                                                <motion.div
                                                    key={item.id}
                                                    // OPTIMIZATION: initial={false} to skip entrance animation
                                                    initial={false}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ height: '100%' }}
                                                >
                                                    <ArticleCard
                                                        article={item}
                                                        layoutIdPrefix={listLayoutIdPrefix}
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
                                </div>
                            </>
                         ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.5 }}
                                style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}
                            >
                                <p style={{ fontSize: '1.8rem' }}>لم يُنشر أي محتوى (مراجعات، أخبار، مقالات) هنا بعد.</p>
                            </motion.div>
                         )
                     )}
            </div>
        </div>
    );
}