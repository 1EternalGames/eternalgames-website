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
import { useIsMobile } from '@/hooks/useIsMobile';

type ArticleCardProps = {
    article: CardProps & { width?: number; height?: number; mainImageRef?: any; };
    layoutIdPrefix: string;
    isPriority?: boolean;
    disableLivingEffect?: boolean; 
    smallTags?: boolean;
};

const getCreatorName = (creators: any[]): string | null => {
    if (!creators || creators.length === 0) return null;
    return creators[0]?.name || null;
};

const ArticleCardComponent = ({ article, layoutIdPrefix, isPriority = false, disableLivingEffect = false, smallTags = false }: ArticleCardProps) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const setScrollPos = useScrollStore((state) => state.setScrollPos);
    const isMobile = useIsMobile();
    
    // PERF: Completely nullify the living card hook on mobile to save event listeners
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    
    const [isHovered, setIsHovered] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 25 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 25 });

    // PERF: Only attach handlers if NOT mobile
    const handlers = !isMobile ? {
        onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!disableLivingEffect) {
                livingCardAnimation.onMouseMove(e);
                const rect = e.currentTarget.getBoundingClientRect();
                mouseX.set(e.clientX - rect.left - 75); 
                mouseY.set(e.clientY - rect.top - 75);
            }
        },
        onMouseEnter: () => {
            if (!disableLivingEffect) {
                livingCardAnimation.onMouseEnter();
                setIsHovered(true);
                setIsTextExpanded(true);
            }
        },
        onMouseLeave: () => {
            if (!disableLivingEffect) {
                livingCardAnimation.onMouseLeave();
                setIsHovered(false);
                // Text expansion is handled by onAnimationComplete
            }
        }
    } : {};

    const getLinkBasePath = () => {
        switch (article.type) {
            case 'review': return '/reviews/';
            case 'article': return '/articles/';
            case 'news': return '/news/';
            default: return '/';
        }
    };
    const linkPath = `${getLinkBasePath()}${article.slug}`;

    const hasScore = article.type === 'review' && typeof article.score === 'number';
    const authorName = getCreatorName(article.authors);
    const authorUsername = article.authors[0]?.username;
    const displayTags = article.tags.slice(0, 3);
    
    const satelliteConfig = [
        { hoverX: -110, hoverY: -50, rotate: -12 },
        { hoverX: 100, hoverY: -30, rotate: 12 }, 
        { hoverX: 0, hoverY: -115, rotate: 5 } 
    ];
    
    const animationStyles = !isMobile && !disableLivingEffect ? livingCardAnimation.style : {};

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
            className={`${styles.livingCardWrapper} ${isHovered ? styles.activeState : ''}`}
            // PERF: Only attach ref on desktop
            ref={!isMobile ? livingCardRef : undefined}
            {...handlers}
            style={{ zIndex: isHovered ? 9999 : 1 }}
        >
            <motion.div
                className="tilt-container flex flex-col"
                // PERF: Remove layoutId on mobile to prevent transition calculation delay
                layoutId={!isMobile ? `${layoutIdPrefix}-card-container-${article.legacyId}` : undefined}
                style={{ 
                    ...animationStyles,
                    borderRadius: '16px',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                }}
            >
                <div 
                    className="no-underline block w-full flex flex-col"
                    style={{ height: '100%', cursor: 'pointer', transformStyle: 'preserve-3d' }}
                >
                    <Link 
                        href={linkPath} 
                        className={`${styles.cardOverlayLink} no-underline`}
                        prefetch={false}
                        onClick={() => {
                            if (!isMobile) {
                                setScrollPos(window.scrollY);
                                setPrefix(layoutIdPrefix);
                            }
                        }}
                    />

                    <div className={styles.monolithFrame}>
                        
                        {!isMobile && (
                            <motion.div 
                                className={styles.holoSpotlight} 
                                style={{ x: smoothMouseX, y: smoothMouseY }} 
                            />
                        )}
                        
                        {!isMobile && <div className={styles.scanLine} />}

                        <motion.div 
                            className={styles.imageWrapper}
                            layoutId={!isMobile ? `${layoutIdPrefix}-card-image-${article.legacyId}` : undefined}
                        >
                            <Image 
                                loader={sanityLoader}
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                className={styles.cardImage}
                                // PERF: Aggressive mobile sizing
                                sizes="(max-width: 768px) 90vw, 500px"
                                placeholder="blur"
                                blurDataURL={article.blurDataURL}
                                priority={isPriority}
                            />
                        </motion.div>

                        {hasScore && (
                             <motion.div 
                                className={styles.scoreBadge}
                                initial={{ scale: 1, rotate: 0 }}
                                animate={{ 
                                    scale: isHovered ? 1.2 : 1, 
                                    rotate: isHovered ? -12 : 0,
                                    z: 50
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                             >
                                 {article.score!.toFixed(1)}
                             </motion.div>
                        )}

                        <div className={styles.titleOverlay}>
                            <motion.div 
                                className={styles.titleMaskWrapper}
                                initial={{ height: '2.8rem' }} 
                                animate={{ height: isHovered ? 'auto' : '2.8rem' }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                onAnimationComplete={() => {
                                    if (!isHovered) setIsTextExpanded(false);
                                }}
                            >
                                <h3 className={`${styles.cardTitle} ${isTextExpanded ? styles.expanded : ''}`}>
                                    {article.title}
                                </h3>
                            </motion.div>
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

                    {!isMobile && (
                        <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                            <AnimatePresence>
                                {displayTags.map((tag, i) => (
                                     <motion.div
                                        key={`${article.id}-${tag.slug}`}
                                        className={styles.satelliteShard}
                                        initial={{ opacity: 0, scale: 0.4, x: 0, y: 50, z: 0 }}
                                        animate={isHovered ? {
                                            opacity: 1,
                                            scale: 1.15,
                                            x: satelliteConfig[i]?.hoverX || 0,
                                            y: satelliteConfig[i]?.hoverY || 0,
                                            rotate: satelliteConfig[i]?.rotate || 0,
                                            z: -30 
                                        } : {
                                            opacity: 0,
                                            scale: 0.4,
                                            x: 0,
                                            y: 50,
                                            rotate: 0,
                                            z: 0
                                        }}
                                        transition={{ type: "spring", stiffness: 180, damping: 20, delay: i * 0.05 }}
                                        style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d' }}
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                         <Link 
                                            href={`/tags/${tag.slug}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            className={`${styles.satelliteShardLink} ${smallTags ? styles.small : ''} no-underline`}
                                            prefetch={false}
                                         >
                                             {translateTag(tag.title)}
                                         </Link>
                                     </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                </div>
            </motion.div>
        </div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;