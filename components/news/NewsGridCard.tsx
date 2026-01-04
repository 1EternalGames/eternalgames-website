// components/news/NewsGridCard.tsx
'use client';

import React, { memo, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
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
import { usePerformanceStore } from '@/lib/performanceStore'; 
import KineticLink from '@/components/kinetic/KineticLink';
import { generateLayoutId } from '@/lib/layoutUtils';

type NewsGridCardProps = {
    item: CardProps;
    isPriority?: boolean;
    layoutIdPrefix: string;
    variant?: 'default' | 'compact' | 'mini';
    onClick?: (e: React.MouseEvent) => void; // Prop for handling click-to-close behavior
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

const NewsGridCardComponent = ({ item, isPriority = false, layoutIdPrefix, variant = 'default', onClick }: NewsGridCardProps) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const isMobile = useIsMobile();
    
    const { isLivingCardEnabled, isFlyingTagsEnabled, isHeroTransitionEnabled, isCornerAnimationEnabled, isHoverDebounceEnabled } = usePerformanceStore();
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const { activeCardId, setActiveCardId } = useActiveCardStore();
    const [isHoveredLocal, setIsHoveredLocal] = useState(false);
    
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
    const touchTimeout = useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const isHovered = isMobile ? activeCardId === item.id : isHoveredLocal;
    const effectivelyDisabledLiving = !isLivingCardEnabled;

    useClickOutside(livingCardRef, () => {
        if (isMobile && activeCardId === item.id) {
            setActiveCardId(null);
        }
    });

    const getLinkData = () => {
        switch (item.type) {
            case 'review': return { type: 'reviews' as const, path: `/reviews/${item.slug}` };
            case 'article': return { type: 'articles' as const, path: `/articles/${item.slug}` };
            default: return { type: 'news' as const, path: `/news/${item.slug}` };
        }
    };
    const { type: kineticType, path: linkPath } = getLinkData();
    
    const handleClick = (e: React.MouseEvent) => {
        // Trigger external click handler (e.g., closing Search)
        if (onClick) onClick(e);

        if ((e.target as HTMLElement).closest('a[href^="/tags/"]')) return;
        if ((e.target as HTMLElement).closest('a[href^="/creators/"]')) return;
        if (!isMobile && isHeroTransitionEnabled) {
            setPrefix(layoutIdPrefix);
        }
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;
    
    const isNews = item.type === 'news';
    const newsType = item.newsType || 'official';
    
    // Creator Data Extraction
    const authorObj = item.authors && item.authors.length > 0 ? item.authors[0] : null;
    const authorName = authorObj ? authorObj.name : 'محرر';
    const authorUsername = authorObj ? authorObj.username : null;
    // Prepare partial data
    const creatorData = authorObj ? { name: authorObj.name, image: authorObj.image } : undefined;

    const flyingItems = useMemo(() => {
        const satellites = [];
        if (item.game && typeof item.game === 'string' && item.gameSlug) {
            satellites.push({ label: item.game, link: `/games/${item.gameSlug}`, isKinetic: false });
        } else { satellites.push(null); }

        // THE DEFINITIVE FIX: Handle all possible shapes for category and tags.
        if (item.category && typeof item.category === 'string') {
            satellites.push({ label: translateTag(item.category), link: undefined, isKinetic: false });
        } else if (Array.isArray(item.tags) && item.tags.length > 0) {
            const firstTag = item.tags[0];
            // Check if the first tag is an object with title and slug properties
            if (firstTag && typeof firstTag === 'object' && firstTag.title && firstTag.slug) {
                satellites.push({ label: translateTag(firstTag.title), link: `/tags/${firstTag.slug}`, isKinetic: false });
            } else {
                satellites.push(null);
            }
        } else {
            satellites.push(null);
        }

        satellites.push({ label: typeDisplayMap[item.type] || 'محتوى', link: undefined, isKinetic: false });
        return satellites;
    }, [item.type, item.category, item.tags, item.game, item.gameSlug]);
    
    const desktopConfig = [
        { hoverX: -180, hoverY: 65, rotate: -6 },   
        { hoverX: 90, hoverY: 70, rotate: 5 },      
        { hoverX: -50, hoverY: -100, rotate: -3 }   
    ];

    const mobileConfig = [
        { hoverX: -150, hoverY: 35, rotate: -4 },
        { hoverX: 160, hoverY: 40, rotate: 4 },
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
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            if (!isHoverDebounceEnabled) { setIsHoveredLocal(true); } 
            else { hoverTimeout.current = setTimeout(() => setIsHoveredLocal(true), 75); }
        },
        onMouseLeave: () => { 
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            if(!effectivelyDisabledLiving) livingCardAnimation.onMouseLeave(); 
            setIsHoveredLocal(false); 
        },
        onMouseMove: !effectivelyDisabledLiving ? livingCardAnimation.onMouseMove : undefined,
    } : {
        onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            const touch = e.touches[0];
            touchStartPos.current = { x: touch.clientX, y: touch.clientY };
            if (touchTimeout.current) clearTimeout(touchTimeout.current);
            if (!isHoverDebounceEnabled) {
                if (activeCardId !== item.id) setActiveCardId(item.id);
            } else {
                touchTimeout.current = setTimeout(() => {
                     if (activeCardId !== item.id) setActiveCardId(item.id);
                }, 75);
            }
            if(!effectivelyDisabledLiving) livingCardAnimation.onTouchStart(e);
        },
        onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => {
             const touch = e.touches[0];
             const diffX = Math.abs(touch.clientX - touchStartPos.current.x);
             const diffY = Math.abs(touch.clientY - touchStartPos.current.y);
             if (diffX > 10 || diffY > 10) {
                 if (touchTimeout.current) clearTimeout(touchTimeout.current);
             }
             if (!effectivelyDisabledLiving) livingCardAnimation.onTouchMove(e);
        },
        onTouchEnd: () => {
             if (!effectivelyDisabledLiving) livingCardAnimation.onTouchEnd();
        },
    };
    
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
                layoutId={!isMobile && safeLayoutIdPrefix ? generateLayoutId(safeLayoutIdPrefix, 'container', item.legacyId) : undefined}
                className={`${styles.newsCard} ${variant === 'compact' ? styles.compact : ''} ${variant === 'mini' ? styles.mini : ''}`}
            >
                <KineticLink 
                    href={linkPath}
                    slug={item.slug}
                    type={kineticType}
                    layoutId={safeLayoutIdPrefix}
                    imageSrc={imageSource}
                    className={`${styles.cardLink} no-underline`}
                    onClick={handleClick}
                >
                    <div className={styles.imageContentWrapper}>
                        <motion.div 
                            className={styles.imageContainer} 
                            layoutId={!isMobile && safeLayoutIdPrefix ? generateLayoutId(safeLayoutIdPrefix, 'image', item.legacyId) : undefined}
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
                                // FIX: Conditional blur data
                                placeholder={item.blurDataURL ? 'blur' : 'empty'}
                                blurDataURL={item.blurDataURL}
                                priority={isPriority}
                            />
                        </motion.div>
                        
                        <div className={styles.cardInfoColumn}>
                            <motion.h3 
                                className={styles.cardTitle}
                                layoutId={!isMobile && safeLayoutIdPrefix ? generateLayoutId(safeLayoutIdPrefix, 'title', item.legacyId) : undefined}
                            >
                                {item.title}
                            </motion.h3>

                            <div className={styles.cardMetadata}>
                                <div style={{display:'flex', alignItems:'center', gap:'0.8rem'}}>
                                    {/* FIX: Propagate onClick to close search even when clicking creator */}
                                    {authorUsername ? (
                                        <KineticLink 
                                            href={`/creators/${authorUsername}`}
                                            slug={authorUsername}
                                            type="creators"
                                            className={`${styles.creatorCapsule} no-underline`}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (onClick) onClick(e); 
                                            }}
                                            // PASS DATA
                                            preloadedData={creatorData}
                                        >
                                            {capsuleContent}
                                        </KineticLink>
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
                </KineticLink>

                {isFlyingTagsEnabled && (
                    <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                        <AnimatePresence>
                             {isHovered && flyingItems.map((sat, i) => {
                                 if (!sat) return null;
                                 
                                 const config = satelliteConfig[i] || { hoverX: 0, hoverY: 0, rotate: 0 };
                                 const isLeft = config.hoverX < 0;
                                 
                                 const anchorRight = isMobile ? !isLeft : isLeft;

                                 const positionStyle = anchorRight 
                                    ? { right: '50%', left: 'auto', top: '50%', transformOrigin: 'center right' }
                                    : { left: '50%', right: 'auto', top: '50%', transformOrigin: 'center left' };

                                 return (
                                     <motion.div
                                        key={`${item.id}-sat-${i}`}
                                        className={styles.satelliteShard}
                                        initial={{ opacity: 0, scale: 0.4, x: 0, y: 50, z: 0 }}
                                        animate={{ opacity: 1, scale: 1.15, x: config.hoverX, y: config.hoverY, rotate: config.rotate, z: -30 }}
                                        exit={{ opacity: 0, scale: 0.4, x: 0, y: 0, rotate: 0, z: 0 }}
                                        transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.05 }}
                                        style={{ position: 'absolute', ...positionStyle, transformStyle: 'preserve-3d' }}
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                         {sat.link ? (
                                             <KineticLink 
                                                href={sat.link} 
                                                slug={sat.link.split('/').pop() || ''} 
                                                type={sat.link.includes('/tags/') ? 'tags' : 'games'}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if(onClick) onClick(e); 
                                                }}
                                                className={`${styles.satelliteShardLink} ${styles.clickable} ${(variant === 'compact' || variant === 'mini') ? styles.small : ''} no-underline`}
                                             >
                                                 {sat.label}
                                             </KineticLink>
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