// components/KineticReleaseTimeline.tsx
'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useInView, useTransform, MotionValue, AnimatePresence } from 'framer-motion';
// Link is replaced by button for kinetic action
import TimelineCard from './TimelineCard';
import styles from './KineticReleaseTimeline.module.css';
import ReleasesCredits from './releases/ReleasesCredits';
import { useContentStore } from '@/lib/contentStore';

const ViewAllIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const SynopsisDisplay = ({ synopsis, isLeft, isInView }: { synopsis: string; isLeft: boolean; isInView: boolean; }) => {
    const [firstWord, ...rest] = synopsis.split(' ');
    const restOfText = rest.join(' ');

    return (
        <AnimatePresence>
            {isInView && (
                <motion.div
                    className={`${styles.synopsisContainer} ${isLeft ? styles.left : styles.right}`}
                    initial={{ opacity: 0, x: isLeft ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLeft ? 20 : -20 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p>
                        <span className={styles.synopsisFirstWord}>{firstWord}</span>
                        {' '}{restOfText}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const TimelineItem = ({ release, index }: { release: any, index: number }) => {
    const itemRef = useRef(null);
    const cardIsInView = useInView(itemRef, { once: true, amount: 0.4 });
    const isLeft = index % 2 === 0;
    
    const variants = {
        hidden: { opacity: 0, x: isLeft ? -30 : 30, scale: 0.95 },
        visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
    };

    return (
        <div ref={itemRef} className={`${styles.timelineItemWrapper} ${isLeft ? styles.left : styles.right}`}>
            <SynopsisDisplay synopsis={release.synopsis} isLeft={isLeft} isInView={cardIsInView} />
            <motion.div 
                variants={variants} 
                initial="hidden" 
                animate={cardIsInView ? "visible" : "hidden"}
                className={styles.cardContainer}
            >
                <TimelineCard release={release} variant="homepage" />
            </motion.div>
        </div>
    );
};

const TimelineDot = ({ position, scrollYProgress }: { position: number, scrollYProgress: MotionValue<number> }) => {
    const activeOpacity = useTransform( scrollYProgress, [position - 0.001, position], [0, 1] );
    return ( 
        <div className={styles.dotWrapper} style={{ top: `${position * 100}%` }}>
            <div className={styles.dotBase} />
            <motion.div className={styles.dotActive} style={{ opacity: activeOpacity }} /> 
        </div> 
    );
};

export default function KineticReleaseTimeline({ releases: allReleases, credits }: { releases: any[], credits?: any[] }) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const terminusRef = useRef(null);
    const isTerminusInView = useInView(terminusRef, { once: true, amount: 0.8 });
    const [dotPositions, setDotPositions] = useState<number[]>([]);
    
    const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start 60%", "end 50%"], });
    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
    
    const { openIndexOverlay } = useContentStore();
    
    const releasesForThisMonth = useMemo(() => {
        if (!allReleases) return [];
        const now = new Date();
        const currentMonth = now.getUTCMonth();
        const currentYear = now.getUTCFullYear();
        
        return allReleases
            .filter(release => {
                if (release.isTBA || !release.releaseDate) return false;
                const releaseDate = new Date(release.releaseDate);
                return releaseDate.getUTCMonth() === currentMonth && releaseDate.getUTCFullYear() === currentYear; 
            })
            .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    }, [allReleases]);

    // Recalculate positions based on real DOM geometry
    const calculatePositions = useCallback(() => {
        if (!timelineRef.current) return;
        const containerEl = timelineRef.current;
        
        // Get precise dimensions
        const containerRect = containerEl.getBoundingClientRect();
        const containerHeight = containerRect.height;
        
        if (containerHeight === 0) return;

        const itemElements = Array.from(containerEl.querySelectorAll(`.${styles.timelineItemWrapper}`));
        
        const positions = itemElements.map(el => { 
            const item = el as HTMLElement; 
            const itemRect = item.getBoundingClientRect();
            
            // Calculate center relative to the container's current visual position
            // boundingClientRect accounts for transforms and scrolling, ensuring accuracy
            const relativeTop = itemRect.top - containerRect.top;
            const center = relativeTop + (itemRect.height / 2);
            
            return center / containerHeight; 
        });
        
        // Avoid state update loops if values haven't changed
        setDotPositions(prev => {
            if (prev.length === positions.length && prev.every((v, i) => Math.abs(v - positions[i]) < 0.0001)) {
                return prev;
            }
            return positions;
        });
    }, []);

    // Observer setup to catch layout shifts (images loading, window resize)
    useEffect(() => {
        if (!timelineRef.current || releasesForThisMonth.length === 0) return;

        // 1. Calculate immediately
        calculatePositions();

        // 2. Observe container resize
        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                calculatePositions();
            });
        });
        
        observer.observe(timelineRef.current);
        
        // 3. Safety fallback for late loading assets that might not trigger resize immediately
        const timeoutId = setTimeout(calculatePositions, 1000);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [releasesForThisMonth, calculatePositions]);

    return (
        <div ref={timelineRef} className={styles.timelineContainer}>
            <ReleasesCredits initialCredits={credits || []} />

            <div className={styles.timelineContent}>
                <div className={styles.timelineSpine}>
                    <div className={styles.timelineSpineTrack} />
                    <motion.div className={styles.timelineSpineProgress} style={{ scaleY, transformOrigin: 'top' }} />
                    <div className={styles.dotsContainer}>
                        {dotPositions.map((pos, index) => ( 
                            <TimelineDot key={index} position={pos} scrollYProgress={scrollYProgress} /> 
                        ))}
                    </div>
                </div>
                <div className={`${styles.timelineItemsWrapper} gpu-cull`}>
                    {releasesForThisMonth.length > 0 ? (
                        releasesForThisMonth.map((release, index) => ( 
                            <TimelineItem key={release._id} release={release} index={index} /> 
                        ))
                    ) : (
                        <motion.div 
                            style={{ paddingTop: '5vh', textAlign: 'center', color: 'var(--text-secondary)', width: '100%' }} 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' as const }}
                        >
                            لا إصدارات مجدولة لهذا الشهر.
                        </motion.div>
                    )}
                </div>

                {releasesForThisMonth.length > 0 && (
                    <motion.div
                        ref={terminusRef}
                        className={styles.terminusContainer}
                        initial={{ opacity: 0, y: 30 }}
                        animate={isTerminusInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    >
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openIndexOverlay('releases')}
                            className={styles.timelineTerminusButton}
                        >
                            <ViewAllIcon className={styles.terminusIcon} />
                            <span>عرض كل الإصدارات</span>
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}