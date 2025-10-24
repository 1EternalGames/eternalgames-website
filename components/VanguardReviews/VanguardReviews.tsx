// components/VanguardReviews/VanguardReviews.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import type { SanityAuthor } from '@/types/sanity';
import type { CardProps } from '@/types';
import styles from './VanguardReviews.module.css';

const VANGUARD_SLOTS = 5;

const creatorBubbleContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};
const creatorBubbleItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="12" x2="2" y2="12"></line><polyline points="15 5 22 12 15 19"></polyline></svg>;
const NavArrow = ({ dir }: { dir: 'left' | 'right' }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points={dir === 'left' ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} /></svg>;


const CreatorBubble = ({ label, creator }: { label: string, creator: SanityAuthor }) => {
    return (
        <motion.div variants={creatorBubbleItemVariants}>
            <motion.div
                className={styles.creatorBubble}
                whileHover={{ scale: 1.1, x: -10, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
            >
                <span className={styles.creatorLabel}>{label}</span>
                <span className={styles.creatorName}>{creator.name}</span>
                <div className={styles.creatorArrow}><ArrowIcon /></div>
            </motion.div>
        </motion.div>
    );
};

const VanguardCard = memo(({ review, isCenter }: { review: CardProps, isCenter: boolean }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const layoutIdPrefix = "vanguard-reviews";

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(`/reviews/${review.slug}`, { scroll: false });
    };

    const baseUrl = review.imageUrl.split('?')[0];
    const imageUrl = `${baseUrl}?w=800&auto=format&q=80`;

    const showCredits = isCenter || isCardHovered;

    return (
        <motion.div
            ref={livingCardRef}
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={() => { livingCardAnimation.onHoverStart(); setIsCardHovered(true); }}
            onMouseLeave={() => { livingCardAnimation.onHoverEnd(); setIsCardHovered(false); }}
            className={styles.cardWrapper}
            style={{...livingCardAnimation.style, transformStyle: 'preserve-3d'}}
        >
            <a href={`/reviews/${review.slug}`} onClick={handleClick} className='no-underline' style={{ display: 'block', height: '100%' }}>
                <div className={styles.vanguardCard}>
                    <div className={styles.cardImageContainer}>
                        <Image
                            src={imageUrl}
                            alt={review.title}
                            fill
                            sizes="40vw"
                            className={styles.cardImage}
                            placeholder="blur"
                            blurDataURL={review.blurDataURL}
                            unoptimized
                        />
                    </div>
                    <div className={styles.cardContent}>
                        <p className={styles.cardScore}>{review.score?.toFixed(1)}</p>
                        <h3>{review.title}</h3>
                    </div>
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

export default function VanguardReviews({ reviews }: { reviews: CardProps[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const startInterval = useCallback(() => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % reviews.length);
        }, 4000);
    }, [reviews.length, stopInterval]);

    const navigateNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % reviews.length);
        startInterval(); // Reset timer on manual navigation
    }, [reviews.length, startInterval]);

    const navigatePrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + reviews.length) % reviews.length);
        startInterval(); // Reset timer on manual navigation
    }, [reviews.length, startInterval]);

    useEffect(() => {
        if (!hoveredId) {
            startInterval();
        } else {
            stopInterval();
        }
        return () => stopInterval();
    }, [reviews.length, hoveredId, startInterval, stopInterval]);

    const getSlotStyle = (index: number, reviewId: string | number) => {
        const style: any = {
            width: `var(--${index === 2 ? 'center' : 'side'}-width)`,
            height: index === 2 ? '450px' : '380px',
            opacity: 1,
            zIndex: 0,
        };

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

        if (hoveredId === reviewId) {
            style.zIndex = 3;
            transform += ' translateY(-15px)';
        }

        style.transform = transform;
        return style;
    };

    const getReviewForSlot = (slotIndex: number) => {
        const reviewIndex = (currentIndex + slotIndex - 2 + reviews.length) % reviews.length;
        return reviews[reviewIndex];
    };
    
    if (reviews.length < VANGUARD_SLOTS) return null;

    return (
        <div className={styles.vanguardContainer} data-hovered={!!hoveredId}>
            <motion.div className={styles.spotlightGlow} animate={{ opacity: hoveredId ? 0.5 : 1 }} />
            <AnimatePresence>
                {Array.from({ length: VANGUARD_SLOTS }).map((_, index) => {
                    const review = getReviewForSlot(index);
                    if (!review) return null;
                    return (
                        <motion.div
                            key={review.id}
                            layoutId={`vanguard-card-${review.id}`}
                            className={styles.cardSlot}
                            onMouseEnter={() => setHoveredId(review.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            initial={false}
                            animate={getSlotStyle(index, review.id)}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        >
                            <VanguardCard review={review} isCenter={index === 2} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            <motion.button className={`${styles.navButton} ${styles.prev}`} onClick={navigatePrev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><NavArrow dir="left" /></motion.button>
            <motion.button className={`${styles.navButton} ${styles.next}`} onClick={navigateNext} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><NavArrow dir="right" /></motion.button>
        </div>
    );
}