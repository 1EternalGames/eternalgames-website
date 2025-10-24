// components/VanguardReviews/VanguardReviews.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import type { SanityAuthor } from '@/types/sanity';
import type { CardProps } from '@/types';
import styles from './VanguardReviews.module.css';

const VANGUARD_SLOTS = 5;
const ANIMATION_COOLDOWN = 450; // ms -- THE DEFINITIVE RECALIBRATION

const creatorBubbleContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};
const creatorBubbleItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="12" x2="2" y2="12"></line><polyline points="15 5 22 12 15 19"></polyline></svg>;

const CreatorBubble = ({ label, creator }: { label: string, creator: SanityAuthor }) => (
    <motion.div variants={creatorBubbleItemVariants}>
        <motion.div className={styles.creatorBubble} whileHover={{ scale: 1.1, x: -10, transition: { type: 'spring', stiffness: 400, damping: 15 } }}>
            <span className={styles.creatorLabel}>{label}</span><span className={styles.creatorName}>{creator.name}</span><div className={styles.creatorArrow}><ArrowIcon /></div>
        </motion.div>
    </motion.div>
);

const VanguardCard = memo(({ review, isCenter, isInView }: { review: CardProps, isCenter: boolean, isInView: boolean }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const router = useRouter(); const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const [isCardHovered, setIsCardHovered] = useState(false); const layoutIdPrefix = "vanguard-reviews";
    const scoreRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (isInView && scoreRef.current && typeof review.score === 'number') {
            const controls = animate(0, review.score, {
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
                onUpdate(value) {
                    if (scoreRef.current) {
                        scoreRef.current.textContent = value.toFixed(1);
                    }
                }
            });
            return () => controls.stop();
        }
    }, [isInView, review.score]);

    const handleClick = (e: React.MouseEvent) => { e.preventDefault(); setPrefix(layoutIdPrefix); router.push(`/reviews/${review.slug}`, { scroll: false }); };
    const imageParams = isCenter ? 'w=800&h=1000' : 'w=560&h=700';
    const baseUrl = review.imageUrl.split('?')[0]; const imageUrl = `${baseUrl}?${imageParams}&fit=crop&auto=format&q=80`;
    const showCredits = isCenter || isCardHovered;

    return (
        <motion.div ref={livingCardRef} onMouseMove={livingCardAnimation.onMouseMove} onMouseEnter={() => { livingCardAnimation.onHoverStart(); setIsCardHovered(true); }} onMouseLeave={() => { livingCardAnimation.onHoverEnd(); setIsCardHovered(false); }} className={styles.cardWrapper} style={{...livingCardAnimation.style, transformStyle: 'preserve-3d'}}>
            <a href={`/reviews/${review.slug}`} onClick={handleClick} className='no-underline' style={{ display: 'block', height: '100%' }}>
                <div className={styles.vanguardCard}>
                    {typeof review.score === 'number' && (
                        <div className={styles.vanguardScoreBadge}>
                            <p ref={scoreRef} style={{ margin: 0 }}>0.0</p>
                        </div>
                    )}
                    <div className={styles.cardImageContainer}><Image src={imageUrl} alt={review.title} fill sizes="(max-width: 768px) 50vw, 30vw" className={styles.cardImage} placeholder="blur" blurDataURL={review.blurDataURL} unoptimized /></div>
                    <motion.div className={styles.cardContent} animate={{ background: isCenter ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} transition={{ duration: 0.5, ease: 'circOut' }}>
                        <h3>{review.title}</h3>
                    </motion.div>
                </div>
            </a>
            <AnimatePresence>
                {showCredits && (
                    <motion.div className={styles.creatorBubbleContainer} variants={creatorBubbleContainerVariants} initial="hidden" animate="visible" exit="hidden">
                        {review.authors.map(author => <CreatorBubble key={author._id} label="مراجعة" creator={author} />)}
                        {review.designers?.map(designer => <CreatorBubble key={designer._id} label="تصميم" creator={designer} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
VanguardCard.displayName = "VanguardCard";

const KineticNavigator = ({ reviews, currentIndex, navigateToIndex }: { reviews: CardProps[], currentIndex: number, navigateToIndex: (index: number) => void }) => {
    const activeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [currentIndex]);

    return (
        <div className={styles.kineticNavigator}>
            <div className={styles.navTrack}>
                {reviews.map((review, index) => {
                    const isActive = currentIndex === index;
                    return (
                        <motion.button key={review.id} ref={isActive ? activeRef : null} className={styles.navItem} data-active={isActive} onClick={() => navigateToIndex(index)} animate={{ width: isActive ? 100 : 50, height: isActive ? 60 : 40 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                            <Image src={`${review.imageUrl.split('?')[0]}?w=200&auto=format&q=70`} alt={review.title} fill sizes="10vw" className={styles.navImage} unoptimized />
                            <AnimatePresence>
                                {isActive && <motion.div className={styles.navTitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{review.title}</motion.div>}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default function VanguardReviews({ reviews }: { reviews: CardProps[] }) {
    const [currentIndex, setCurrentIndex] = useState(0); const [hoveredId, setHoveredId] = useState<string | number | null>(null); const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, amount: 0.3 });

    const stopInterval = useCallback(() => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
    
    // --- THE DEFINITIVE FIX IS HERE ---
    // Removed `currentIndex` from the dependency array and used a functional update
    // for `setCurrentIndex` to prevent stale state in the interval closure.
    const startInterval = useCallback(() => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % reviews.length);
        }, 5000);
    }, [reviews.length, stopInterval]);
    
    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating) return;
        if (index === currentIndex) return;

        setIsAnimating(true);
        setCurrentIndex(index);
        
        // Restart the interval timer after a manual navigation
        startInterval();
        
        setTimeout(() => setIsAnimating(false), ANIMATION_COOLDOWN);
    }, [isAnimating, currentIndex, startInterval]);
    
    useEffect(() => { if (!hoveredId) { startInterval(); } else { stopInterval(); } return () => stopInterval(); }, [reviews.length, hoveredId, startInterval, stopInterval]);
    
    const getSlotStyle = (index: number, reviewId: string | number) => {
        const style: any = { width: `var(--${index === 2 ? 'center' : 'side'}-width)`, height: index === 2 ? '500px' : '350px', opacity: 1, zIndex: 0 };
        const offset = (typeof window !== 'undefined' && window.innerWidth > 768) ? 250 : 160;
        let transform = '';
        switch (index) {
            case 0: transform = `translateX(${-offset * 1.7}px) scale(0.75)`; break;
            case 1: transform = `translateX(${-offset}px) scale(0.85)`; style.zIndex = 1; break;
            case 2: transform = `translateX(0) scale(1)`; style.zIndex = 2; break;
            case 3: transform = `translateX(${offset}px) scale(0.85)`; style.zIndex = 1; break;
            case 4: transform = `translateX(${offset * 1.7}px) scale(0.75)`; break;
            default: style.opacity = 0;
        }
        if (hoveredId === reviewId) { style.zIndex = 3; transform += ' translateY(-15px)'; }
        style.transform = transform; return style;
    };
    const getReviewForSlot = (slotIndex: number) => reviews[(currentIndex + slotIndex - 2 + reviews.length) % reviews.length];
    if (reviews.length < VANGUARD_SLOTS) return null;

    return (
        <div ref={containerRef} className={styles.vanguardContainer} data-hovered={!!hoveredId}>
            <motion.div className={styles.spotlightGlow} animate={{ opacity: hoveredId ? 0.5 : 1 }} />
            <AnimatePresence>
                {Array.from({ length: VANGUARD_SLOTS }).map((_, index) => {
                    const review = getReviewForSlot(index); if (!review) return null;
                    return (
                        <motion.div key={review.id} layoutId={`vanguard-card-${review.id}`} className={styles.cardSlot} onMouseEnter={() => setHoveredId(review.id)} onMouseLeave={() => setHoveredId(null)} initial={false} animate={getSlotStyle(index, review.id)} exit={{ opacity: 0, scale: 0.5 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
                            <VanguardCard review={review} isCenter={index === 2} isInView={isInView} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            <KineticNavigator reviews={reviews} currentIndex={currentIndex} navigateToIndex={navigateToIndex} />
        </div>
    );
}