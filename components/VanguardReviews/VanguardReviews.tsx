// components/VanguardReviews/VanguardReviews.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useInView, animate, PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useVanguardCarousel } from '@/hooks/useVanguardCarousel';
import { urlFor } from '@/sanity/lib/image';
import type { SanityAuthor } from '@/types/sanity';
import type { CardProps } from '@/types';
import styles from './VanguardReviews.module.css';

const creatorBubbleContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};
const creatorBubbleItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } }
};
const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24" fill="none" role="img" color="currentColor">
        <path d="M12.293 5.29273C12.6591 4.92662 13.2381 4.90402 13.6309 5.22437L13.707 5.29273L19.707 11.2927L19.7754 11.3689C20.0957 11.7617 20.0731 12.3407 19.707 12.7068L13.707 18.7068C13.3165 19.0973 12.6835 19.0973 12.293 18.7068C11.9025 18.3163 11.9025 17.6833 12.293 17.2927L16.5859 12.9998H5C4.44772 12.9998 4 12.552 4 11.9998C4 11.4475 4.44772 10.9998 5 10.9998H16.5859L12.293 6.7068L12.2246 6.63063C11.9043 6.23785 11.9269 5.65885 12.293 5.29273Z" fill="currentColor"></path>
    </svg>
);

const CreatorBubble = ({ label, creator }: { label: string, creator: SanityAuthor }) => {
    const [isPressed, setIsPressed] = useState(false);
    const handleBubbleClick = (e: React.MouseEvent) => { e.stopPropagation(); };
    const profileSlug = creator.username || (creator.slug as any)?.current || creator.name?.toLowerCase().replace(/\s+/g, '-');
    const hasPublicProfile = !!profileSlug;
    
    const bubbleContent = (
        <motion.div 
            className={`${styles.creatorBubble} ${isPressed ? styles.pressed : ''}`}
            whileHover={{ scale: 1.1, x: -10, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onTouchCancel={() => setIsPressed(false)}
        >
            <span className={styles.creatorLabel}>{label}</span>
            <span className={styles.creatorName}>{creator.name}</span>
            <div className={styles.creatorArrow}><ArrowIcon /></div>
        </motion.div>
    );
    
    return (
        <motion.div variants={creatorBubbleItemVariants}>
            {hasPublicProfile ? (
                // THE FIX: Added prefetch={false} to prevent automatic fetching of creator pages
                <Link href={`/creators/${profileSlug}`} onClick={handleBubbleClick} className="no-underline" prefetch={false}>
                    {bubbleContent}
                </Link>
            ) : (
                <div title={`${creator.name} (no public profile)`}>
                    {bubbleContent}
                </div>
            )}
        </motion.div>
    );
};

const VanguardCard = memo(({ review, isCenter, isInView, isPriority, isMobile, isHovered, isInteractive }: { review: CardProps, isCenter: boolean, isInView: boolean, isPriority: boolean, isMobile: boolean, isHovered: boolean, isInteractive: boolean }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const router = useRouter(); const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "vanguard-reviews";
    const scoreRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => {
        if (isInView && scoreRef.current && typeof review.score === 'number') {
            const controls = animate(0, review.score, {
                duration: 1.5, ease: [0.22, 1, 0.36, 1],
                onUpdate(value) { if (scoreRef.current) { scoreRef.current.textContent = value.toFixed(1); } }
            });
            return () => controls.stop();
        }
    }, [isInView, review.score]);

    const linkPath = `/reviews/${review.slug}`;
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.ctrlKey || e.metaKey) return; // Allow opening in new tab
        if ((e.target as HTMLElement).closest('a[href^="/creators"]')) {
            e.stopPropagation();
            return;
        }
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };
    
    const imageUrl = review.mainImageRef 
        ? urlFor(review.mainImageRef).width(isCenter ? 800 : 560).height(isCenter ? 1000 : 700).fit('crop').auto('format').url()
        : review.imageUrl;

    const showCredits = isCenter || isHovered;
    
    const livingCardHandlers = isInteractive ? {
        onMouseMove: livingCardAnimation.onMouseMove,
        onTouchMove: livingCardAnimation.onTouchMove, // ADDED: Touch move handler
        onMouseEnter: livingCardAnimation.onMouseEnter,
        onMouseLeave: livingCardAnimation.onMouseLeave,
        onTouchStart: livingCardAnimation.onTouchStart,
        onTouchEnd: livingCardAnimation.onTouchEnd,
        onTouchCancel: livingCardAnimation.onTouchCancel,
    } : {};

    return (
        <div className={styles.cardWrapper}>
            <a 
                href={linkPath}
                onClick={handleClick}
                className="no-underline"
                style={{ display: 'block', height: '100%', cursor: 'pointer' }}
            >
                <motion.div
                    ref={livingCardRef}
                    {...livingCardHandlers}
                    style={{ ...livingCardAnimation.style, transformStyle: 'preserve-3d', height: '100%' }}
                    layoutId={`${layoutIdPrefix}-card-container-${review.legacyId}`} 
                    className={styles.vanguardCard}
                >
                    <AnimatePresence>
                        {showCredits && (
                            <motion.div
                                className={styles.creatorBubbleContainer}
                                variants={creatorBubbleContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                style={{ pointerEvents: 'auto', transform: 'translateZ(50px)' }}
                            >
                                {review.authors.map(author => <CreatorBubble key={author._id} label="بقلم" creator={author} />)}
                                {review.designers?.map(designer => <CreatorBubble key={designer._id} label="تصميم" creator={designer} />)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {typeof review.score === 'number' && (<div className={styles.vanguardScoreBadge}><p ref={scoreRef} style={{ margin: 0 }}>0.0</p></div>)}
                    <motion.div layoutId={`${layoutIdPrefix}-card-image-${review.legacyId}`} className={styles.cardImageContainer}>
                        <Image 
                            src={imageUrl} 
                            alt={review.title} 
                            fill 
                            sizes={isCenter ? "(max-width: 768px) 80vw, 400px" : "(max-width: 768px) 60vw, 280px"}
                            className={styles.cardImage} 
                            placeholder="blur" 
                            blurDataURL={review.blurDataURL} 
                            priority={isPriority}
                        />
                    </motion.div>
                    <motion.div className={styles.cardContent} animate={{ background: isCenter ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} transition={{ duration: 0.5, ease: 'circOut' }}>
                        <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${review.legacyId}`}>{review.title}</motion.h3>
                        {review.date && <p className={styles.cardDate}>{review.date.split(' - ')[0]}</p>}
                    </motion.div>
                </motion.div>
            </a>
        </div>
    );
});
VanguardCard.displayName = "VanguardCard";

const KineticNavigator = ({ reviews, currentIndex, navigateToIndex }: { reviews: CardProps[], currentIndex: number, navigateToIndex: (index: number) => void }) => {
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    useEffect(() => { const activeItem = itemRefs.current[currentIndex]; if (activeItem) { activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } }, [currentIndex]);
    return (
        <div className={styles.kineticNavigator}>
            <div className={styles.navTrack}>
                {reviews.map((review, index) => {
                    const isActive = currentIndex === index;
                    return (
                        <motion.button 
                            key={review.id} 
                            ref={el => { itemRefs.current[index] = el }} 
                            className={styles.navItem} 
                            data-active={isActive} 
                            onTap={() => navigateToIndex(index)}
                            whileTap={{ scale: 0.95 }}
                            animate={{ width: isActive ? 100 : 50, height: isActive ? 60 : 40 }} 
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                            <Image src={`${review.imageUrl.split('?')[0]}?w=200&auto=format`} alt={review.title} fill sizes="10vw" className={styles.navImage} unoptimized />
                            <AnimatePresence>{isActive && <motion.div className={styles.navTitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{review.title}</motion.div>}</AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default function VanguardReviews({ reviews }: { reviews: CardProps[] }) {
    const containerRef = useRef(null);
    const hasAnimatedIn = useInView(containerRef, { once: true, amount: 0.1 });
    const isCurrentlyInView = useInView(containerRef, { amount: 0.4 });
    const [initialAnimHasRun, setInitialAnimHasRun] = useState(false);
    const [isManualHover, setIsManualHover] = useState(false);

    const {
        currentIndex,
        hoveredId,
        setHoveredId,
        navigateToIndex,
        getCardState,
        isMobile
    } = useVanguardCarousel(reviews.length, isCurrentlyInView);

    useEffect(() => {
        if (hasAnimatedIn && !initialAnimHasRun) {
            const timer = setTimeout(() => setInitialAnimHasRun(true), 800);
            return () => clearTimeout(timer);
        }
    }, [hasAnimatedIn, initialAnimHasRun]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            navigateToIndex((currentIndex + 1) % reviews.length);
        } else if (info.offset.x > swipeThreshold) {
            navigateToIndex((currentIndex - 1 + reviews.length) % reviews.length);
        }
    };

    if (reviews.length === 0) return null;

    const centerCardState = getCardState(currentIndex, reviews[currentIndex].id);
    const centerStyle = centerCardState.style;
    const initialAnimationConfig = {
        ...centerStyle,
        opacity: 0,
        transform: centerStyle.transform ? centerStyle.transform.replace(/scale\([0-9.]+\)/, 'scale(0.8)') : 'scale(0.8)',
    };


    return (
        <div 
            ref={containerRef} 
            className={`${styles.vanguardContainer} ${isManualHover ? styles['manual-hover'] : ''}`}
        >
            <motion.div className={styles.spotlightGlow} animate={{ opacity: hoveredId ? 0.5 : 1 }} />
            
            <motion.div
                style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                onTouchEnd={() => initialAnimHasRun && setHoveredId(null)}
                onTouchCancel={() => initialAnimHasRun && setHoveredId(null)}
                onMouseEnter={() => setIsManualHover(true)}
                onMouseLeave={() => setIsManualHover(false)}
            >
                {reviews.map((review, reviewIndex) => {
                    const { style, isCenter } = getCardState(reviewIndex, review.id);
                    const isHovered = hoveredId === review.id;
                    
                    return (
                        <motion.div 
                            key={review.id} 
                            className={styles.cardSlot} 
                            onMouseEnter={() => initialAnimHasRun && setHoveredId(review.id)} 
                            onMouseLeave={() => initialAnimHasRun && setHoveredId(null)}
                            onTouchStart={() => initialAnimHasRun && setHoveredId(review.id)}
                            initial={!initialAnimHasRun ? initialAnimationConfig : false}
                            animate={style}
                            transition={{
                                ease: [0.4, 0, 0.2, 1],
                                duration: 0.7,
                                delay: !initialAnimHasRun ? (isCenter ? 0 : 0.2) : 0,
                            }}
                        >
                            <VanguardCard 
                                review={review} 
                                isCenter={isCenter} 
                                isInView={hasAnimatedIn}
                                isPriority={isCenter}
                                isMobile={isMobile}
                                isHovered={isHovered}
                                isInteractive={initialAnimHasRun}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
            
            {hasAnimatedIn && <KineticNavigator reviews={reviews} currentIndex={currentIndex} navigateToIndex={navigateToIndex} />}
        </div>
    );
}