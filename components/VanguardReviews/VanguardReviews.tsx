// components/VanguardReviews/VanguardReviews.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
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
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="12" x2="2" y2="12"></line><polyline points="15 5 22 12 15 19"></polyline></svg>;

const CreatorBubble = ({ label, creator }: { label: string, creator: SanityAuthor }) => {
    const bubbleContent = (
        <motion.div 
            className={styles.creatorBubble} 
            whileHover={{ scale: 1.1, x: -10, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
        >
            <span className={styles.creatorLabel}>{label}</span>
            <span className={styles.creatorName}>{creator.name}</span>
            <div className={styles.creatorArrow}><ArrowIcon /></div>
        </motion.div>
    );
    return (
        <motion.div variants={creatorBubbleItemVariants}>
            {creator.username ? (
                <Link
                    href={`/creators/${creator.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="no-underline"
                >
                    {bubbleContent}
                </Link>
            ) : (<div title={`${creator.name} (no public profile)`}>{bubbleContent}</div>)}
        </motion.div>
    );
};

const VanguardCard = memo(({ review, isCenter, isInView, isPriority, isMobile }: { review: CardProps, isCenter: boolean, isInView: boolean, isPriority: boolean, isMobile: boolean }) => {
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
    const handleClick = (e: React.MouseEvent) => { e.preventDefault(); setPrefix(layoutIdPrefix); router.push(`/reviews/${review.slug}`, { scroll: false }); };
    
    const imageUrl = review.mainImageRef 
        ? urlFor(review.mainImageRef).width(isCenter ? 800 : 560).height(isCenter ? 1000 : 700).fit('crop').auto('format').url()
        : review.imageUrl;

    const showCredits = isCenter; // Only show for center card on both mobile and desktop
    return (
        <motion.div ref={livingCardRef} onMouseMove={livingCardAnimation.onMouseMove} onMouseEnter={livingCardAnimation.onHoverStart} onMouseLeave={livingCardAnimation.onHoverEnd} className={styles.cardWrapper} style={{...livingCardAnimation.style, transformStyle: 'preserve-3d'}}>
            <Link href={`/reviews/${review.slug}`} onClick={handleClick} className="no-underline" style={{ display: 'block', height: '100%', cursor: 'pointer' }}>
                <div className={styles.vanguardCard}>
                    {typeof review.score === 'number' && (<div className={styles.vanguardScoreBadge}><p ref={scoreRef} style={{ margin: 0 }}>0.0</p></div>)}
                    <div className={styles.cardImageContainer}>
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
                    </div>
                    <motion.div className={styles.cardContent} animate={{ background: isCenter ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} transition={{ duration: 0.5, ease: 'circOut' }}>
                        <h3>{review.title}</h3>
                        {review.date && <p className={styles.cardDate}>{review.date.split(' - ')[0]}</p>}
                    </motion.div>
                </div>
            </Link>
            <AnimatePresence>
                {showCredits && (
                    <motion.div className={styles.creatorBubbleContainer} variants={creatorBubbleContainerVariants} initial="hidden" animate="visible" exit="hidden">
                        {review.authors.map(author => <CreatorBubble key={author._id} label="بقلم" creator={author} />)}
                        {review.designers?.map(designer => <CreatorBubble key={designer._id} label="تصميم" creator={designer} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
                        <motion.button key={review.id} ref={el => { itemRefs.current[index] = el }} className={styles.navItem} data-active={isActive} onClick={() => navigateToIndex(index)} animate={{ width: isActive ? 100 : 50, height: isActive ? 60 : 40 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
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

    const {
        currentIndex,
        hoveredId,
        setHoveredId,
        navigateToIndex,
        getSlotStyle,
        getReviewForSlot,
        VANGUARD_SLOTS,
        isMobile
    } = useVanguardCarousel(reviews.length, isCurrentlyInView);

    if (reviews.length < VANGUARD_SLOTS) return null;

    return (
        <div ref={containerRef} className={styles.vanguardContainer} data-hovered={!!hoveredId}>
            <motion.div className={styles.spotlightGlow} animate={{ opacity: hoveredId ? 0.5 : 1 }} />
            
            {Array.from({ length: VANGUARD_SLOTS }).map((_, index) => {
                const reviewIndex = getReviewForSlot(index);
                if (reviewIndex === null) return null;
                const review = reviews[reviewIndex];
                const isCenter = isMobile ? index === 1 : index === 2;
                
                return (
                    <motion.div 
                        key={review.id} 
                        layoutId={`vanguard-card-${review.id}`} 
                        className={styles.cardSlot} 
                        onMouseEnter={() => setHoveredId(review.id)} 
                        onMouseLeave={() => setHoveredId(null)}
                        animate={getSlotStyle(index, review.id)}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                    >
                        <VanguardCard 
                            review={review} 
                            isCenter={isCenter} 
                            isInView={hasAnimatedIn}
                            isPriority={isCenter}
                            isMobile={isMobile}
                        />
                    </motion.div>
                );
            })}
            
            {hasAnimatedIn && <KineticNavigator reviews={reviews} currentIndex={currentIndex} navigateToIndex={navigateToIndex} />}
        </div>
    );
}