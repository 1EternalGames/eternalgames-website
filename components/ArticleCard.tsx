// components/ArticleCard.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useScrollStore } from '@/lib/scrollStore';
import CreatorCredit from './CreatorCredit';
import TagLinks from './TagLinks';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './ArticleCard.module.css';

// Type mapping for the "Type Badge"
const TYPE_LABELS: Record<string, string> = {
    review: 'مراجعة',
    article: 'مقال',
    news: 'خبر',
};

type ArticleCardProps = {
    article: CardProps & { width?: number; height?: number; mainImageRef?: any; };
    layoutIdPrefix: string;
    isPriority?: boolean;
    disableLivingEffect?: boolean; 
};

const ArticleCardComponent = ({ article, layoutIdPrefix, isPriority = false, disableLivingEffect = false }: ArticleCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const setScrollPos = useScrollStore((state) => state.setScrollPos);
    // Generic hook now explicitly typed for Div
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();

    // Interactive Holographic Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disableLivingEffect) return;
        
        // 1. Trigger the tilt from the hook
        livingCardAnimation.onMouseMove(e);

        // 2. Local calculations for the glare effect
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const type = article.type;
    const typeLabel = TYPE_LABELS[type] || 'محتوى';

    const getLinkBasePath = () => {
        switch (type) {
            case 'review': return '/reviews/';
            case 'article': return '/articles/';
            case 'news': return '/news/';
            default: return '/';
        }
    };

    const linkPath = `${getLinkBasePath()}${article.slug}`;
    
    const handleClick = (e: React.MouseEvent) => {
        // Allow clicks on nested links (creators, tags) to bubble appropriately or be handled
        if ((e.target as HTMLElement).closest('a[href^="/creators"]') || (e.target as HTMLElement).closest('a[href^="/tags"]')) {
            return;
        }
        e.preventDefault();
        
        setScrollPos(window.scrollY);
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const hasScore = type === 'review' && typeof article.score === 'number';
    const imageSource = article.imageUrl;
    if (!imageSource) return null;

    // Smoother transition for layout animations
    const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

    const wrapperProps = disableLivingEffect ? {} : {
        ref: livingCardRef,
        onMouseMove: handleMouseMove, // Using our wrapped handler
        onMouseEnter: livingCardAnimation.onMouseEnter,
        onMouseLeave: livingCardAnimation.onMouseLeave,
        onTouchStart: livingCardAnimation.onTouchStart,
        onTouchEnd: livingCardAnimation.onTouchEnd,
        onTouchCancel: livingCardAnimation.onTouchCancel,
    };
    
    const motionStyle = disableLivingEffect 
        ? { cursor: 'pointer', position: 'relative', zIndex: 1 } 
        : { ...livingCardAnimation.style, cursor: 'pointer', position: 'relative', zIndex: 1 };

    // Dynamic Radial Gradient for the Glare
    const glareBackground = useMotionTemplate`radial-gradient(
        circle at ${mouseX}px ${mouseY}px,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.05) 40%,
        transparent 80%
    )`;

    return (
        <motion.div
            layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`}
            transition={springTransition}
            onClick={handleClick}
            className={styles.livingCardWrapper}
            {...wrapperProps}
            style={motionStyle as any}
        >
            <div className={styles.articleCard}>
                
                {/* PARALLAX LAYER 1: IMAGE & EFFECTS */}
                <motion.div 
                    className={styles.imageContainer} 
                    layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`}
                    transition={springTransition}
                >
                    {/* Interactive Holographic Glare */}
                    <motion.div 
                        className={styles.holographicOverlay}
                        style={{ background: glareBackground }}
                    />
                    
                    {/* Sheen Sweep */}
                    <div className={styles.sheenLayer} />

                    <Image 
                        loader={sanityLoader}
                        src={imageSource}
                        alt={article.title}
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                        className={styles.cardImage}
                        style={{ objectFit: 'cover' }}
                        placeholder="blur" 
                        blurDataURL={article.blurDataURL}
                        priority={isPriority}
                    />
                    <div className={styles.imageOverlay} />
                    
                    {/* Floating Badges inside Image Area for Parallax Context */}
                    {hasScore && (
                         <motion.div 
                            className={styles.scoreBadge}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                         >
                             {article.score!.toFixed(1)}
                         </motion.div> 
                    )}
                    
                    <div className={styles.typeBadge}>
                        {typeLabel}
                    </div>
                </motion.div>

                {/* PARALLAX LAYER 2: CONTENT */}
                <div className={styles.cardContent}>
                    <Link href={linkPath} className={styles.cardTitleLink} prefetch={false} onClick={(e) => e.preventDefault()}>
                        <motion.h3 
                            className={styles.cardTitle}
                            layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`}
                            transition={springTransition}
                        >
                            {article.title}
                        </motion.h3>
                    </Link>

                    <div className={styles.metaRow}>
                        <div className={styles.authorBlock}>
                             <CreatorCredit label="بقلم" creators={article.authors} small />
                        </div>
                        {article.date && (
                            <div className={styles.dateBlock}>
                                <Calendar03Icon className={styles.metaIcon} />
                                <span>{article.date}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.cardFooter}>
                         {/* Pass small=true to TagLinks for the compact style */}
                        <TagLinks tags={article.tags.slice(0, 3).map(tag => tag.title)} small={true} />
                        
                        {/* Decorative Neon Pulse Dots */}
                        <div className={styles.techDecoration}>
                            <div className={styles.techDot}></div>
                            <div className={styles.techDot}></div>
                            <div className={styles.techDot}></div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;