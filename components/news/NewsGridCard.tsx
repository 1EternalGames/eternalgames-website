// components/news/NewsGridCard.tsx
'use client';

import React, { memo, useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader'; 
import { Calendar03Icon } from '@/components/icons';
import styles from './NewsGridCard.module.css';
import { translateTag } from '@/lib/translations';

type NewsGridCardProps = {
    item: CardProps;
    isPriority?: boolean;
    layoutIdPrefix: string;
};

const typeLabelMap: Record<string, string> = {
    'official': 'رسمي',
    'rumor': 'إشاعة',
    'leak': 'تسريب'
};

const NewsGridCardComponent = ({ item, isPriority = false, layoutIdPrefix }: NewsGridCardProps) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    
    // Internal state
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const touchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const linkPath = `/news/${item.slug}`;
    
    const handleClick = () => {
        setPrefix(layoutIdPrefix);
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;
    
    const newsType = item.newsType || 'official';
    
    const authorName = item.authors && item.authors.length > 0 ? item.authors[0].name : 'محرر';
    const authorImage = item.authors && item.authors.length > 0 && item.authors[0].image 
        ? item.authors[0].image 
        : null;
    const authorUsername = item.authors && item.authors.length > 0 ? item.authors[0].username : null;

    // --- Flying Satellites Generation ---
    const flyingItems = useMemo(() => {
        const satellites = [];

        // 1. Generic "News" Tag
        satellites.push({ label: 'خبر', link: undefined, color: 'var(--accent)' });

        // 2. Category
        if (item.category) {
            satellites.push({
                label: translateTag(item.category),
                link: undefined,
                color: '#fff'
            });
        }

        // 3. Game
        if (item.game && item.gameSlug) {
            satellites.push({
                label: item.game,
                link: `/games/${item.gameSlug}`,
                color: '#fff'
            });
        }

        return satellites;
    }, [item.category, item.game, item.gameSlug]);

    const gameTitleLength = item.game?.length || 0;
    
    // Desktop Coordinates
    const desktopGameTagX = -180 - (Math.max(0, gameTitleLength - 8) * 4.5);
    const desktopConfig = [
        { hoverX: -80, hoverY: -70, rotate: -8 },
        { hoverX: 120, hoverY: 30, rotate: 6 },
        { hoverX: desktopGameTagX, hoverY: 50, rotate: -4 } 
    ];

    // Mobile Coordinates
    const mobileGameTagX = -60 - (Math.max(0, gameTitleLength - 5) * 3);
    const mobileConfig = [
        { hoverX: -50, hoverY: -55, rotate: -5 },
        { hoverX: 50, hoverY: 60, rotate: 5 },
        { hoverX: mobileGameTagX, hoverY: 45, rotate: -2 } 
    ];

    const satelliteConfig = isMobile ? mobileConfig : desktopConfig;

    const capsuleContent = (
        <>
            <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                <Image 
                    src={typeof authorImage === 'string' ? authorImage : '/default-avatar.svg'} 
                    alt={authorName}
                    fill
                    className={styles.capsuleAvatar}
                />
            </div>
            <span>{authorName}</span>
        </>
    );
    
    // --- Interaction Handlers ---
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        livingCardAnimation.onTouchStart(e);
        setIsHovered(true);
    };

    const handleTouchEnd = () => {
        livingCardAnimation.onTouchEnd();
        setIsHovered(false);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        livingCardAnimation.onTouchMove(e);
    };

    const mouseHandlers = isMobile ? {} : {
        onMouseEnter: () => { livingCardAnimation.onMouseEnter(); setIsHovered(true); },
        onMouseLeave: () => { livingCardAnimation.onMouseLeave(); setIsHovered(false); },
        onMouseMove: livingCardAnimation.onMouseMove,
    };

    const touchHandlers = isMobile ? {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
        onTouchMove: handleTouchMove
    } : {};

    return (
        <motion.div
            ref={livingCardRef}
            {...mouseHandlers}
            {...touchHandlers}
            className={`${styles.cardContainer} ${isHovered ? styles.activeState : ''}`}
            style={livingCardAnimation.style}
        >
            <motion.div
                layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
                className={styles.newsCard}
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
                            layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`}
                        >
                            <span className={`${styles.imageBadge} ${styles[newsType]}`}>
                                {typeLabelMap[newsType]}
                            </span>
                            
                            <Image 
                                loader={sanityLoader}
                                src={imageSource}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 150px, 260px"
                                className={styles.cardImage}
                                style={{ objectFit: 'cover' }}
                                placeholder="blur" 
                                blurDataURL={item.blurDataURL}
                                priority={isPriority}
                            />
                        </motion.div>
                        
                        <div className={styles.cardInfoColumn}>
                            <div>
                                <motion.h3 
                                    className={styles.cardTitle}
                                    layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`}
                                >
                                    {item.title}
                                </motion.h3>
                            </div>

                            <div className={styles.cardMetadata}>
                                <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
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
                                        {/* FIX: Swapped icon and text order for better RTL layout */}
                                        <Calendar03Icon className={styles.metadataIcon} />
                                        <span>{item.date.split(' - ')[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                    <AnimatePresence>
                         {isHovered && flyingItems.map((sat, i) => (
                             <motion.div
                                key={`${item.id}-sat-${i}`}
                                className={styles.satelliteShard}
                                initial={{ opacity: 0, scale: 0.4, x: 0, y: 0, z: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: satelliteConfig[i]?.hoverX || 0,
                                    y: satelliteConfig[i]?.hoverY || 0,
                                    rotate: satelliteConfig[i]?.rotate || 0,
                                    z: 50
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.4,
                                    x: 0,
                                    y: 0,
                                    rotate: 0,
                                    z: 0
                                }}
                                transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.05 }}
                                style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d' }}
                                onClick={(e) => e.stopPropagation()}
                             >
                                 {sat.link ? (
                                     <Link 
                                        href={sat.link} 
                                        onClick={(e) => e.stopPropagation()}
                                        className={`${styles.satelliteShardLink} no-underline`}
                                        prefetch={false}
                                     >
                                         {sat.label}
                                     </Link>
                                 ) : (
                                     <span className={styles.satelliteShardLink} style={{ cursor: 'default' }}>
                                         {sat.label}
                                     </span>
                                 )}
                             </motion.div>
                         ))}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

const NewsGridCard = memo(NewsGridCardComponent);
export default NewsGridCard;