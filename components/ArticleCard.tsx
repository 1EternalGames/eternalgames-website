// components/ArticleCard.tsx
'use client';

import React, { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useScrollStore } from '@/lib/scrollStore';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { PenEdit02Icon, Calendar03Icon } from '@/components/icons/index';
import { useLivingCard } from '@/hooks/useLivingCard';
import { translateTag } from '@/lib/translations';
import styles from './ArticleCard.module.css';

type ArticleCardProps = {
    article: CardProps & { width?: number; height?: number; mainImageRef?: any; };
    layoutIdPrefix: string;
    isPriority?: boolean;
    disableLivingEffect?: boolean; 
};

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

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 25 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 25 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!disableLivingEffect) {
            livingCardAnimation.onMouseMove(e);
            const rect = e.currentTarget.getBoundingClientRect();
            mouseX.set(e.clientX - rect.left - 75); 
            mouseY.set(e.clientY - rect.top - 75);
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

    const getLinkBasePath = () => {
        switch (article.type) {
            case 'review': return '/reviews/';
            case 'article': return '/articles/';
            case 'news': return '/news/';
            default: return '/';
        }
    };
    const linkPath = `${getLinkBasePath()}${article.slug}`;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) {
            return;
        }

        e.preventDefault();
        setScrollPos(window.scrollY);
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const hasScore = article.type === 'review' && typeof article.score === 'number';
    const authorName = getCreatorName(article.authors);
    const authorUsername = article.authors[0]?.username;

    const displayTags = article.tags.slice(0, 3);
    
    // UPDATED:
    // 1. Reduced Left hoverX (-145 -> -115) to make it nearer
    // 2. Maintained other positions
    const satelliteConfig = [
        { hoverX: -110, hoverY: -50, rotate: -12 },
        { hoverX: 135, hoverY: -35, rotate: 12 },
        { hoverX: 0, hoverY: -125, rotate: 5 }
    ];
    
    const { boxShadow, ...otherAnimationStyles } = livingCardAnimation.style;

    const CreatorCapsule = () => {
        const content = (
            <>
                <div className={styles.capsuleIcon}>
                    <PenEdit02Icon style={{ width: 14, height: 14 }} />
                </div>
                <span title={authorName || ''}>{authorName}</span>
            </>
        );

        if (authorUsername) {
            return (
                <Link 
                    href={`/creators/${authorUsername}`}
                    className={`${styles.creditCapsule} no-underline`}
                    onClick={(e) => e.stopPropagation()}
                    prefetch={false}
                >
                    {content}
                </Link>
            );
        }

        return (
            <div className={styles.creditCapsule}>
                {content}
            </div>
        );
    };

    return (
        <div
            className={styles.livingCardWrapper}
            ref={livingCardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
        >
            <motion.div
                className="tilt-container flex flex-col"
                layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`}
                style={{ 
                    ...(disableLivingEffect ? {} : otherAnimationStyles),
                    borderRadius: '16px',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                }}
            >
                <div 
                    className="no-underline block w-full flex flex-col"
                    style={{ height: '100%', cursor: 'pointer', transformStyle: 'preserve-3d' }}
                >
                    <div className={styles.monolithFrame}>
                        
                        <motion.div 
                            className={styles.holoSpotlight} 
                            style={{ x: smoothMouseX, y: smoothMouseY }} 
                        />
                        
                        <div className={styles.scanLine} />

                        <motion.div 
                            className={styles.imageWrapper}
                            layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`}
                        >
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
                        </motion.div>

                        {hasScore && (
                             <motion.div 
                                className={styles.scoreBadge}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: isHovered ? 1.1 : 0.9, rotate: isHovered ? -10 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                style={{ transform: 'translateZ(50px)' }}
                             >
                                 {article.score!.toFixed(1)}
                             </motion.div>
                        )}

                        <div className={styles.titleOverlay}>
                            <motion.h3 
                                layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`}
                                className={styles.cardTitle}
                            >
                                {article.title}
                            </motion.h3>
                        </div>
                        
                        <div className={styles.hudContainer} style={{ transform: 'translateZ(60px)' }}>
                             {authorName ? <CreatorCapsule /> : <div />}

                             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem'}}>
                                {article.date && (
                                    <div className={styles.dateReadout}>
                                        <Calendar03Icon style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                                        {article.date.split(' - ')[0]}
                                    </div>
                                )}
                                <div className={styles.techDecoration}>
                                    <div className={styles.techDot} />
                                    <div className={styles.techDot} />
                                    <div className={styles.techDot} />
                                </div>
                             </div>
                        </div>

                    </div>

                    <div className={styles.satelliteField} style={{ transform: 'translateZ(100px)' }}>
                        <AnimatePresence>
                             {displayTags.map((tag, i) => (
                                 <motion.div
                                    key={`${article.id}-${tag.slug}`}
                                    className={styles.satelliteShard}
                                    initial={{ opacity: 0, scale: 0.4, x: 0, y: 30, z: 0 }}
                                    animate={isHovered ? {
                                        opacity: 1,
                                        scale: 1,
                                        x: satelliteConfig[i]?.hoverX || 0,
                                        y: satelliteConfig[i]?.hoverY || 0,
                                        rotate: satelliteConfig[i]?.rotate || 0,
                                        // UPDATED: Reduced Z from 50 to 30.
                                        // This reduces the parallax movement (floating effect) when hovering.
                                        z: -30 
                                    } : {
                                        opacity: 0,
                                        scale: 0.4,
                                        x: 0,
                                        y: 30,
                                        rotate: 0,
                                        z: 0
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 180,
                                        damping: 20,
                                        delay: i * 0.05
                                    }}
                                    style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d' }}
                                    onClick={(e) => e.stopPropagation()}
                                 >
                                     <Link 
                                        href={`/tags/${tag.slug}`} 
                                        onClick={(e) => e.stopPropagation()}
                                        className={`${styles.satelliteShardLink} no-underline`}
                                        prefetch={false}
                                     >
                                         {translateTag(tag.title)}
                                     </Link>
                                 </motion.div>
                             ))}
                        </AnimatePresence>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;