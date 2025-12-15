// components/TimelineCard.tsx
'use client';

import React, { memo, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SanityGameRelease } from '@/types/sanity';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, Transition } from 'framer-motion';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';
import { translateTag } from '@/lib/translations';

// Icons
import { Calendar03Icon } from '@/components/icons';
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

import styles from './TimelineCard.module.css';

// --- CONFIGURATION FOR FLYING PLATFORM TAGS (Right Side) ---
const PLATFORM_FLY_CONFIG = {
    TARGET_RIGHT: 60,
    RIGHT_STEP: -7,
    TARGET_BOTTOM: 160,
    BOTTOM_STEP: 42,
    BASE_ROT: -7,     
    ROT_STEP: 0    
};

// --- CONFIGURATION FOR GENRE TAGS (Left Side) ---
const GENRE_FLY_CONFIG = {
    TARGET_RIGHT_PCT: 92, 
    RIGHT_STEP: 2,       // Stagger percentage
    TARGET_BOTTOM: 200,
    BOTTOM_STEP: 42,
    BASE_ROT: 7, 
    ROT_STEP: 0
};

// --- CONFIGURATION FOR PRICE (Top Right) ---
const PRICE_FLY_CONFIG = {
    X: -130,
    Y: -110,
    ROT: 7
};

// --- CONFIGURATION FOR DEVELOPER (Top Center) ---
const DEV_FLY_CONFIG = {
    X: 0,
    Y: -155,
    ROT: 0
};

// --- CONFIGURATION FOR STATUS/COUNTDOWN (Bottom Center) ---
const STATUS_FLY_CONFIG = {
    X: 0,
    Y: 140,
    ROT: -3
};

// --- CONFIGURATION FOR PUBLISHER (Top Left) ---
const PUBLISHER_FLY_CONFIG = {
    X: 130, 
    Y: -110, 
    ROT: -5,
    anchor: 'right' // Anchored right pushes it left
};

// Define sorting weights. 
const PLATFORM_SORT_WEIGHTS: Record<string, number> = {
    'Switch': 4,
    'Xbox': 3,
    'PlayStation': 2,
    'PlayStation 5': 2,
    'PC': 1,
};

const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'PC': PCIcon,
    'PlayStation': PS5Icon,
    'PlayStation 5': PS5Icon,
    'Xbox': XboxIcon,
    'Switch': SwitchIcon,
};

const PlatformNames: Record<string, string> = {
    'PC': 'PC',
    'PlayStation': 'PS5',
    'PlayStation 5': 'PS5',
    'Xbox': 'Xbox',
    'Switch': 'Switch',
};

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg> );
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> );
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg> );

// Common transition for smooth morphing both ways
const morphTransition: Transition = {
    type: "spring",
    stiffness: 150, 
    damping: 22,
    mass: 1
};

const TimelineCardComponent = ({ release }: { release: SanityGameRelease & { game?: { slug?: string, title?: string }, tags?: any[] } }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const [isHovered, setIsHovered] = useState(false);

    // --- Glare Logic ---
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 150 });
    const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 150 });
    const glareX = useTransform(smoothMouseX, [0, 1], ['0%', '100%']);
    const glareY = useTransform(smoothMouseY, [0, 1], ['0%', '100%']);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        livingCardAnimation.onMouseMove(e);
        if (!livingCardRef.current) return;
        const { left, top, width, height } = livingCardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const handleMouseLeave = () => {
        livingCardAnimation.onMouseLeave();
        setIsHovered(false);
        mouseX.set(0.5); mouseY.set(0.5);
    };

    // --- Data ---
    const releaseDate = new Date(release.releaseDate);
    const isReleased = releaseDate < new Date();
    const isTBA = release.isTBA;

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const formattedDate = isTBA ? "TBA" : `${releaseDate.getDate()} ${arabicMonths[releaseDate.getMonth()]} ${releaseDate.getFullYear()}`;
    const gameLink = release.game?.slug ? `/games/${release.game.slug}` : null;
    const mainHref = gameLink || '/releases'; 
    const layoutIdPrefix = `timeline-${release._id}`;
    
    const platforms = release.platforms || [];

    const handleClick = (e: React.MouseEvent) => {
        if (!gameLink) return;
        setPrefix(layoutIdPrefix);
    };

    // --- Flying Satellites (General) ---
    const flyingItems = useMemo(() => {
        const satellites = [];

        // 1. Countdown (Bottom Center)
        if (!isReleased && !isTBA) {
             const msPerDay = 1000 * 60 * 60 * 24;
             const daysLeft = Math.ceil((releaseDate.getTime() - new Date().getTime()) / msPerDay);
             
             let label = `باقي ${daysLeft} يوم`;
             let colorClass = "cyan";

             if (daysLeft <= 3) colorClass = "golden";
             else if (daysLeft <= 10) colorClass = "red";
             else if (daysLeft <= 20) colorClass = "orange";
             else colorClass = "cyan";

             satellites.push({
                 type: 'status',
                 label: label,
                 colorClass: colorClass,
                 x: STATUS_FLY_CONFIG.X, 
                 y: STATUS_FLY_CONFIG.Y, 
                 rotate: STATUS_FLY_CONFIG.ROT,
                 anchor: 'center'
             });
        }

        // 2. DEVELOPER (Top Center)
        if (release.developer && release.developer.title) {
            satellites.push({
                type: 'dev',
                label: release.developer.title,
                link: `/developers/${release.developer.slug}`, 
                x: DEV_FLY_CONFIG.X,
                y: DEV_FLY_CONFIG.Y, 
                rotate: DEV_FLY_CONFIG.ROT,
                anchor: 'center'
            });
        }

        // 3. PRICE (Top Right)
        if (release.price) {
            satellites.push({
                type: 'price',
                label: release.price,
                x: PRICE_FLY_CONFIG.X, 
                y: PRICE_FLY_CONFIG.Y, 
                rotate: PRICE_FLY_CONFIG.ROT,
                anchor: 'left' 
            });
        }
        
        // 4. PUBLISHER (Top Left)
        if (release.publisher && release.publisher.title) {
            satellites.push({
                type: 'dev', 
                label: release.publisher.title,
                link: `/publishers/${release.publisher.slug}`,
                x: PUBLISHER_FLY_CONFIG.X,
                y: PUBLISHER_FLY_CONFIG.Y,
                rotate: PUBLISHER_FLY_CONFIG.ROT,
                anchor: 'right'
            });
        }

        return satellites;
    }, [isReleased, isTBA, releaseDate, release.developer, release.price, release.publisher]);

    // --- Flying Platforms (Right Side) ---
    const platformConfig = useMemo(() => {
        const validPlatforms = platforms.filter(p => PlatformIcons[p]);
        validPlatforms.sort((a, b) => {
            const weightA = PLATFORM_SORT_WEIGHTS[a] || 0;
            const weightB = PLATFORM_SORT_WEIGHTS[b] || 0;
            return weightA - weightB;
        });

        return validPlatforms.map((p, i) => {
            const Icon = PlatformIcons[p];
            const targetRight = PLATFORM_FLY_CONFIG.TARGET_RIGHT + (i * PLATFORM_FLY_CONFIG.RIGHT_STEP);
            const targetBottom = PLATFORM_FLY_CONFIG.TARGET_BOTTOM + (i * PLATFORM_FLY_CONFIG.BOTTOM_STEP); 
            const rot = PLATFORM_FLY_CONFIG.BASE_ROT + (i * PLATFORM_FLY_CONFIG.ROT_STEP);

            return {
                key: p,
                name: PlatformNames[p] || p,
                Icon: Icon,
                right: targetRight,
                bottom: targetBottom,
                rotate: rot
            };
        });
    }, [platforms]);

    // --- Flying Genres (Left Side) ---
    const genreConfig = useMemo(() => {
        if (!release.tags || release.tags.length === 0) return [];
        // Take top 3 genres max
        const genres = release.tags.slice(0, 3);
        
        return genres.map((g, i) => {
             const targetRightPct = GENRE_FLY_CONFIG.TARGET_RIGHT_PCT + (i * GENRE_FLY_CONFIG.RIGHT_STEP);
             const targetBottom = GENRE_FLY_CONFIG.TARGET_BOTTOM + (i * GENRE_FLY_CONFIG.BOTTOM_STEP);
             const rot = GENRE_FLY_CONFIG.BASE_ROT + (i * GENRE_FLY_CONFIG.ROT_STEP);
             
             // Safely handle potentially missing slug for legacy tags using explicit casting
             const slug = typeof g.slug === 'string' ? g.slug : ((g.slug as any)?.current || '');

             return {
                 key: g._id || i,
                 name: translateTag(g.title),
                 link: slug ? `/tags/${slug}` : '#', 
                 right: `${targetRightPct}%`, 
                 bottom: targetBottom,
                 rotate: rot
             }
        });
    }, [release.tags]);

    const imageUrl = release.mainImage 
        ? urlFor(release.mainImage).width(800).height(450).fit('crop').auto('format').url()
        : '/placeholder-game.jpg';
    
    const blurDataURL = release.mainImage?.blurDataURL;

    // Touch
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { livingCardAnimation.onTouchStart(e); setIsHovered(true); };
    const handleTouchEnd = () => { livingCardAnimation.onTouchEnd(); setIsHovered(false); };
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { livingCardAnimation.onTouchMove(e); };

    return (
        <motion.div
            ref={livingCardRef}
            className={`${styles.livingCardWrapper} ${isHovered ? styles.activeState : ''}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => { livingCardAnimation.onMouseEnter(); setIsHovered(true); }}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchMove={handleTouchMove}
            style={livingCardAnimation.style}
        >
            <div className={styles.timelineCard}>
                <Link 
                    href={mainHref} 
                    className="no-underline block h-full"
                    onClick={handleClick}
                    prefetch={false}
                >
                    <motion.div className={styles.glare} style={{ '--mouse-x': glareX, '--mouse-y': glareY } as any} />

                    <div className={styles.imageFrame}>
                        {isReleased ? (
                            <div className={`${styles.statusBadge} ${styles.released}`}>
                                <CheckIcon className={styles.iconSvg} />
                                <span>صدرت</span>
                            </div>
                        ) : (
                            <div className={`${styles.statusBadge} ${styles.upcoming}`}>
                                <ClockIcon className={styles.iconSvg} />
                                <span>قادمة</span>
                            </div>
                        )}

                        <motion.div layoutId={`${layoutIdPrefix}-image`} className="relative w-full h-full">
                            <Image
                                loader={sanityLoader}
                                src={imageUrl}
                                alt={release.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className={styles.cardImage}
                                placeholder={blurDataURL ? 'blur' : 'empty'}
                                blurDataURL={blurDataURL}
                            />
                        </motion.div>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.titleRow}>
                            <motion.h3 
                                layoutId={`${layoutIdPrefix}-title`} 
                                className={styles.cardTitle}
                                style={{ direction: 'ltr', textAlign: 'left', width: '100%' }}
                            >
                                {release.title}
                            </motion.h3>
                        </div>
                        
                        <div className={styles.metaGrid}>
                            <div className={styles.dateBlock}>
                                <Calendar03Icon className={styles.iconSvg} style={{ color: 'var(--accent)' }} />
                                <span>{formattedDate}</span>
                            </div>
                            
                            {/* PLATFORM ICONS (FOOTER ROW) */}
                            <div className={styles.platformRow}>
                                {platformConfig.map(p => {
                                    if (!p) return null;
                                    const lid = `plat-${release._id}-${p.key}`;
                                    
                                    return (
                                        <div key={p.key} style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {!isHovered && (
                                                <motion.div
                                                    layoutId={lid}
                                                    className={styles.platformTagBase}
                                                    transition={morphTransition}
                                                    initial={{ rotate: 0, scale: 1, backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)" }}
                                                    animate={{ rotate: 0, scale: 1, backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)" }}
                                                    style={{ color: "var(--text-secondary)", padding: 0 }}
                                                >
                                                    <p.Icon className={styles.platformIcon} style={{ width: '16px', height: '16px' }} />
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* --- FLYING PLATFORM TAGS (RIGHT) --- */}
                <div className={styles.flyingTagsContainer}>
                    {isHovered && platformConfig.map(p => {
                        const lid = `plat-${release._id}-${p.key}`;
                        return (
                            <motion.div
                                key={p.key}
                                layoutId={lid}
                                className={`${styles.platformTagBase} ${styles.flying}`}
                                transition={{ layout: morphTransition, rotate: morphTransition, scale: morphTransition, backgroundColor: morphTransition, borderColor: morphTransition, color: morphTransition }}
                                initial={{ rotate: 0, scale: 1 }}
                                animate={{ rotate: p.rotate, scale: 1.2, backgroundColor: "rgba(0, 0, 0, 0.85)", borderColor: "var(--accent)", color: "var(--accent)" }}
                                style={{ position: 'absolute', right: p.right, bottom: p.bottom, padding: "0.4rem 1rem", zIndex: 100, boxShadow: "0 0 15px color-mix(in srgb, var(--accent) 30%, transparent)", transformOrigin: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p.Icon className={styles.platformIcon} style={{ width: '16px', height: '16px' }} />
                                <span style={{ overflow: 'hidden', fontSize: '1.1rem' }}>{p.name}</span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* --- FLYING GENRE TAGS (LEFT) --- */}
                <div className={styles.flyingTagsContainer} style={{ left: 0, right: 'auto', width: '100%' }}>
                    {isHovered && genreConfig.map((g, i) => (
                        <motion.div
                            key={g.key}
                            initial={{ opacity: 0, x: -20, rotate: 0 }}
                            animate={{ opacity: 1, x: 0, rotate: g.rotate, scale: 1.2 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ ...morphTransition, delay: i * 0.05 }}
                            className={styles.genrePill}
                            style={{ 
                                position: 'absolute', 
                                right: g.right, 
                                bottom: g.bottom, 
                                zIndex: 100, 
                                transformOrigin: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <Link href={g.link || '#'} onClick={(e) => e.stopPropagation()} className="no-underline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit'}}>
                                <TagIcon style={{ width: '14px', height: '14px' }} />
                                <span style={{ fontSize: '1.1rem' }}>{g.name}</span>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className={styles.satelliteField}>
                    <AnimatePresence>
                        {isHovered && flyingItems.map((item, i) => {
                            if (!item) return null;
                            const isLeft = item.anchor === 'right' || item.x < 0; 
                            const positionStyle = isLeft 
                                ? { right: '50%', left: 'auto', transformOrigin: 'center right' }
                                : { left: '50%', right: 'auto', transformOrigin: 'center left' };
                            
                            if (item.anchor === 'center') {
                                positionStyle.left = '50%'; positionStyle.right = 'auto'; positionStyle.transformOrigin = 'center';
                            }
                            
                            let pillStyleClass = styles.shardPill;
                            if (item.type === 'status') pillStyleClass = `${styles.shardPill} ${styles.statusPill} ${styles[item.colorClass!]}`; 
                            else if (item.type === 'price') pillStyleClass = `${styles.shardPill} ${styles.pricePill}`;
                            else if (item.type === 'dev') pillStyleClass = `${styles.shardPill} ${styles.devPill}`;

                            const content = <span>{item.label}</span>;

                            return (
                                <motion.div
                                    key={`shard-${i}`}
                                    className={styles.satelliteShard}
                                    initial={{ opacity: 0, scale: 0.4, x: 0, y: 0, z: 0 }}
                                    animate={{ opacity: 1, scale: 1.1, x: item.x, y: item.y, rotate: item.rotate, z: 40 }}
                                    exit={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                                    transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.05 }}
                                    style={{ ...positionStyle }}
                                >
                                    {item.link ? (
                                         <Link href={item.link} onClick={(e) => e.stopPropagation()} className={`${pillStyleClass} no-underline interactive`}>
                                             {content}
                                         </Link>
                                    ) : (
                                        <div className={pillStyleClass}>{content}</div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
};

export default memo(TimelineCardComponent);