// components/news/NewsGridCard.tsx
'use client';

import React, { memo, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader'; 
import { Calendar03Icon, PenEdit02Icon } from '@/components/icons';
import styles from './NewsGridCard.module.css';
import { translateTag } from '@/lib/translations';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useActiveCardStore } from '@/lib/activeCardStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePerformanceStore } from '@/lib/performanceStore'; // Import Store

type NewsGridCardProps = {
    item: CardProps;
    isPriority?: boolean;
    layoutIdPrefix: string;
    variant?: 'default' | 'compact' | 'mini';
};

const typeLabelMap: Record<string, string> = {
    'official': 'رسمي',
    'rumor': 'إشاعة',
    'leak': 'تسريب'
};

const typeDisplayMap: Record<string, string> = {
    'news': 'خبر',
    'article': 'مقال',
    'review': 'مراجعة'
};

const NewsGridCardComponent = ({ item, isPriority = false, layoutIdPrefix, variant = 'default' }: NewsGridCardProps) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const isMobile = useIsMobile();
    
    // Performance Settings
    const { isLivingCardEnabled, isFlyingTagsEnabled, isHeroTransitionEnabled, isCornerAnimationEnabled } = usePerformanceStore();

    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const { activeCardId, setActiveCardId } = useActiveCardStore();
    
    const [isHoveredLocal, setIsHoveredLocal] = useState(false);
    const isHovered = isMobile ? activeCardId === item.id : isHoveredLocal;

    const effectivelyDisabledLiving = !isLivingCardEnabled;

    useClickOutside(livingCardRef, () => {
        if (isMobile && activeCardId === item.id) {
            setActiveCardId(null);
        }
    });

    const getLinkPath = () => {
        switch (item.type) {
            case 'review': return `/reviews/${item.slug}`;
            case 'article': return `/articles/${item.slug}`;
            default: return `/news/${item.slug}`;
        }
    };
    const linkPath = getLinkPath();
    
    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a[href^="/tags/"]')) return;
        if (!isMobile && isHeroTransitionEnabled) {
            setPrefix(layoutIdPrefix);
        }
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;
    
    const isNews = item.type === 'news';
    const newsType = item.newsType || 'official';
    
    const authorName = item.authors && item.authors.length > 0 ? item.authors[0].name : 'محرر';
    const authorUsername = item.authors && item.authors.length > 0 ? item.authors[0].username : null;

    const flyingItems = useMemo(() => {
        const satellites = [];
        if (item.game && item.gameSlug) {
            satellites.push({ label: item.game, link: `/games/${item.gameSlug}` });
        } else { satellites.push(null); }

        if (item.category) {
            satellites.push({ label: translateTag(item.category), link: undefined });
        } else if (item.tags && item.tags.length > 0) {
             satellites.push({ label: translateTag(item.tags[0].title), link: `/tags/${item.tags[0].slug}` });
        } else { satellites.push(null); }

        satellites.push({ label: typeDisplayMap[item.type] || 'محتوى', link: undefined });

        return satellites;
    }, [item.type, item.category, item.tags, item.game, item.gameSlug]);
    
    const desktopConfig = [
        { hoverX: -180, hoverY: 65, rotate: -6 },   
        { hoverX: 90, hoverY: 70, rotate: 5 },      
        { hoverX: -50, hoverY: -100, rotate: -3 }   
    ];

    const mobileConfig = [
        { hoverX: -90, hoverY: 20, rotate: -4 },
        { hoverX: 70, hoverY: 40, rotate: 4 },
        { hoverX: 0, hoverY: -85, rotate: -2 } 
    ];

    const compactConfig = [
        { hoverX: -110, hoverY: 30, rotate: -5 },
        { hoverX: 70, hoverY: 35, rotate: 4 },
        { hoverX: -20, hoverY: -65, rotate: -2 }
    ];

    let satelliteConfig;
    if (isMobile) {
        satelliteConfig = mobileConfig;
    } else if (variant === 'compact' || variant === 'mini') {
        satelliteConfig = compactConfig;
    } else {
        satelliteConfig = desktopConfig;
    }

    const capsuleContent = (
        <>
            <div className={styles.capsuleIcon}>
                <PenEdit02Icon style={{ width: 14, height: 14 }} />
            </div>
            <span>{authorName}</span>
        </>
    );
    
    const handlers = !isMobile ? {
        onMouseEnter: () => { 
            if(!effectivelyDisabledLiving) livingCardAnimation.onMouseEnter(); 
            setIsHoveredLocal(true); 
        },
        onMouseLeave: () => { 
            if(!effectivelyDisabledLiving) livingCardAnimation.onMouseLeave(); 
            setIsHoveredLocal(false); 
        },
        onMouseMove: !effectivelyDisabledLiving ? livingCardAnimation.onMouseMove : undefined,
    } : {
        onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            if (activeCardId !== item.id) {
                setActiveCardId(item.id);
            }
            if(!effectivelyDisabledLiving) livingCardAnimation.onTouchStart(e);
        },
        onTouchMove: !effectivelyDisabledLiving ? livingCardAnimation.onTouchMove : undefined,
        onTouchEnd: !effectivelyDisabledLiving ? livingCardAnimation.onTouchEnd : undefined,
    };
    
    // Apply layoutId logic
    const safeLayoutIdPrefix = isHeroTransitionEnabled ? layoutIdPrefix : undefined;
    const animationStyles = !effectivelyDisabledLiving ? livingCardAnimation.style : {};

    return (
        <motion.div
            ref={livingCardRef} 
            {...handlers}
            className={`${styles.cardContainer} ${isHovered ? styles.activeState : ''} ${!isCornerAnimationEnabled ? 'noCornerAnimation' : ''}`}
            style={animationStyles}
        >
            <motion.div
                layoutId={!isMobile && safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-container-${item.legacyId}` : undefined}
                className={`${styles.newsCard} ${variant === 'compact' ? styles.compact : ''} ${variant === 'mini' ? styles.mini : ''}`}
            >
                <Link 
                    href={linkPath} 
                    className={`${styles.cardLink} no-underline`}
                    onClick={handleClick}
                    prefetch={false} 
                >
                    <div className={styles.imageContentWrapper}>
                        <motion.div 
                            className={styles.imageContainer} 
                            layoutId={!isMobile && safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-image-${item.legacyId}` : undefined}
                        >
                            {isNews && (
                                <span className={`${styles.imageBadge} ${styles[newsType]}`}>
                                    {typeLabelMap[newsType]}
                                </span>
                            )}
                            
                            <Image 
                                loader={sanityLoader}
                                src={imageSource}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 130px, 260px"
                                className={styles.cardImage}
                                style={{ objectFit: 'cover' }}
                                placeholder="blur" 
                                blurDataURL={item.blurDataURL}
                                priority={isPriority}
                            />
                        </motion.div>
                        
                        <div className={styles.cardInfoColumn}>
                            <motion.h3 
                                className={styles.cardTitle}
                                layoutId={!isMobile && safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-card-title-${item.legacyId}` : undefined}
                            >
                                {item.title}
                            </motion.h3>

                            <div className={styles.cardMetadata}>
                                <div style={{display:'flex', alignItems:'center', gap:'0.8rem'}}>
                                    {authorUsername ? (
                                        <Link 
                                            href={`/creators/${authorUsername}`}
                                            className={`${styles.creatorCapsule} no-underline`}
                                            onClick={(e) => e.stopPropagation()} 
                                            prefetch={false}
                                        >
                                            {capsuleContent}
                                        </Link>
                                    ) : (
                                        <div className={styles.creatorCapsule}>
                                            {capsuleContent}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.techDecoration}>
                                    <div className={styles.techDot} />
                                    <div className={styles.techDot} />
                                    <div className={styles.techDot} />
                                </div>

                                {item.date && (
                                    <div className={styles.cardDate}>
                                        <Calendar03Icon className={styles.metadataIcon} />
                                        <span>{item.date.split(' - ')[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                {isFlyingTagsEnabled && (
                    <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                        <AnimatePresence>
                             {isHovered && flyingItems.map((sat, i) => {
                                 if (!sat) return null;
                                 
                                 const config = satelliteConfig[i] || { hoverX: 0, hoverY: 0, rotate: 0 };
                                 const isLeft = config.hoverX < 0;
                                 
                                 const positionStyle = isLeft 
                                    ? { right: '50%', left: 'auto', top: '50%', transformOrigin: 'center right' }
                                    : { left: '50%', right: 'auto', top: '50%', transformOrigin: 'center left' };

                                 return (
                                     <motion.div
                                        key={`${item.id}-sat-${i}`}
                                        className={styles.satelliteShard}
                                        initial={{ opacity: 0, scale: 0.4, x: 0, y: 50, z: 0 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1.15,
                                            x: config.hoverX,
                                            y: config.hoverY,
                                            rotate: config.rotate,
                                            z: -30 
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.4,
                                            x: 0,
                                            y: 50,
                                            rotate: 0,
                                            z: 0
                                        }}
                                        transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.05 }}
                                        style={{ 
                                            position: 'absolute', 
                                            ...positionStyle, 
                                            transformStyle: 'preserve-3d' 
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                         {sat.link ? (
                                             <Link 
                                                href={sat.link} 
                                                onClick={(e) => e.stopPropagation()}
                                                className={`${styles.satelliteShardLink} ${styles.clickable} ${(variant === 'compact' || variant === 'mini') ? styles.small : ''} no-underline`}
                                                prefetch={false}
                                             >
                                                 {sat.label}
                                             </Link>
                                         ) : (
                                             <span className={`${styles.satelliteShardLink} ${styles.static} ${(variant === 'compact' || variant === 'mini') ? styles.small : ''}`}>
                                                 {sat.label}
                                             </span>
                                         )}
                                     </motion.div>
                                 );
                             })}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const NewsGridCard = memo(NewsGridCardComponent);
export default NewsGridCard;