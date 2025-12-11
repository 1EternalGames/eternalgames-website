// components/ArticleCard.tsx
'use client';

import React, { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useScrollStore } from '@/lib/scrollStore';
import TagLinks from './TagLinks'; 
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { PenEdit02Icon, Calendar03Icon } from '@/components/icons/index';
import { useLivingCard } from '@/hooks/useLivingCard';
import styles from './ArticleCard.module.css';

type ArticleCardProps = {
    article: CardProps & { width?: number; height?: number; mainImageRef?: any; };
    layoutIdPrefix: string;
    isPriority?: boolean;
    disableLivingEffect?: boolean; 
};

// -- HELPER: Extract creator name safely for manual rendering --
const getCreatorName = (creators: any[]): string | null => {
    if (!creators || creators.length === 0) return null;
    return creators[0]?.name || null;
};

const ArticleCardComponent = ({ article, layoutIdPrefix, isPriority = false, disableLivingEffect = false }: ArticleCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const setScrollPos = useScrollStore((state) => state.setScrollPos);
    
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const [isHovered, setIsHovered] = useState(false);

    // Glare Tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!disableLivingEffect) {
            livingCardAnimation.onMouseMove(e);
            const rect = e.currentTarget.getBoundingClientRect();
            mouseX.set(e.clientX - rect.left);
            mouseY.set(e.clientY - rect.top);
        }
    };

    const handleMouseEnter = () => {
        if (!disableLivingEffect) {
            livingCardAnimation.onMouseEnter();
            setIsHovered(true);
        }
    };
    
    const handleMouseLeave = () => {
        if (!disableLivingEffect) {
            livingCardAnimation.onMouseLeave();
            setIsHovered(false);
        }
    };

    // Navigation
    const getLinkBasePath = () => {
        switch (article.type) {
            case 'review': return '/reviews/';
            case 'article': return '/articles/';
            case 'news': return '/news/';
            default: return '/';
        }
    };
    const linkPath = `${getLinkBasePath()}${article.slug}`;

    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a[href^="/creators"]')) return;
        e.preventDefault();
        setScrollPos(window.scrollY);
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const hasScore = article.type === 'review' && typeof article.score === 'number';
    const authorName = getCreatorName(article.authors);

    // MODIFIED: Adjusted orbital configuration for 3D Float
    const displayTags = article.tags.slice(0, 3);
    const satelliteConfig = [
        { hoverX: -130, hoverY: -60, rotate: -5 },   // Top Left far
        { hoverX: 140, hoverY: -40, rotate: 6 },     // Top Right far
        { hoverX: 0, hoverY: -140, rotate: 2 }       // Top Center far
    ];

    // Intense Glare Gradient
    const glareBackground = useMotionTemplate`radial-gradient(
        500px circle at ${mouseX}px ${mouseY}px,
        rgba(255, 255, 255, 0.25) 0%,
        rgba(0, 255, 240, 0.1) 40%,
        transparent 80%
    )`;

    return (
        <div
            className={styles.livingCardWrapper}
            ref={livingCardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="tilt-container h-full flex flex-col"
                style={disableLivingEffect ? {} : livingCardAnimation.style}
            >
                <Link 
                    href={linkPath}
                    onClick={handleClick}
                    prefetch={false}
                    className="no-underline block h-full w-full flex flex-col"
                >
                    {/* --- THE MONOLITH --- */}
                    <div className={styles.monolithFrame}>
                        {/* Effects Layer */}
                        <motion.div className={styles.holoGlare} style={{ background: glareBackground }} />
                        <div className={styles.scanLine} />

                        {/* Image */}
                        <Image 
                            loader={sanityLoader}
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className={styles.cardImage}
                            sizes="(max-width: 768px) 100vw, 500px"
                            placeholder="blur"
                            blurDataURL={article.blurDataURL}
                            priority={isPriority}
                        />

                        {/* Floating Score: Enhanced Z Depth */}
                        {hasScore && (
                             <motion.div 
                                className={styles.scoreBadge}
                                initial={{ scale: 0.9, z: 0 }}
                                animate={{ 
                                    scale: isHovered ? 1.2 : 0.9, 
                                    rotate: isHovered ? -10 : 0,
                                    z: isHovered ? 100 : 0 // Motion controlled Z-index for smooth pop
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                             >
                                 {article.score!.toFixed(1)}
                             </motion.div>
                        )}

                        {/* Title Overlay */}
                        <div className={styles.titleOverlay}>
                            <motion.h3 
                                layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`}
                                className={styles.cardTitle}
                            >
                                {article.title}
                            </motion.h3>
                        </div>
                    </div>

                    {/* --- ORBITALS: 3D Floating Tags --- */}
                    <div className={styles.satelliteField}>
                        <AnimatePresence>
                             {displayTags.map((tag, i) => (
                                 <motion.div
                                    key={`${article.id}-${tag.slug}`}
                                    className={styles.satelliteShard}
                                    initial={{ opacity: 0, scale: 0.4, z: 0 }}
                                    animate={isHovered ? {
                                        opacity: 1,
                                        scale: 1,
                                        x: satelliteConfig[i]?.hoverX || 0,
                                        y: satelliteConfig[i]?.hoverY || 0,
                                        rotate: satelliteConfig[i]?.rotate || 0,
                                        z: 100 // Projecting outwards in 3D
                                    } : {
                                        opacity: 0,
                                        scale: 0.4,
                                        x: 0,
                                        y: 50,
                                        z: 0
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 160,
                                        damping: 18,
                                        delay: i * 0.05
                                    }}
                                    style={{ left: '50%', top: '50%' }}
                                 >
                                     {/* REMOVED: Circle span indicator */}
                                     {tag.title}
                                 </motion.div>
                             ))}
                        </AnimatePresence>
                    </div>

                    {/* --- INFO HUD (Metadata Bar) --- */}
                    <div className={styles.hudContainer}>
                         {/* Credit Pill */}
                         {authorName ? (
                            <div className={styles.creditCapsule}>
                                <div className={styles.capsuleIcon}>
                                    <PenEdit02Icon style={{ width: 14, height: 14 }} />
                                </div>
                                <span title={authorName}>{authorName}</span>
                            </div>
                         ) : <div />}

                         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem'}}>
                            {/* Date */}
                            {article.date && (
                                <div className={styles.dateReadout}>
                                    <Calendar03Icon style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                                    {article.date.split(' - ')[0]}
                                </div>
                            )}
                            
                            {/* Tech Decor */}
                            <div className={styles.techDecoration}>
                                <div className={styles.techDot} />
                                <div className={styles.techDot} />
                                <div className={styles.techDot} />
                            </div>
                         </div>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;