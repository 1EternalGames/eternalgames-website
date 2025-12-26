// components/ReadingHud.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, AnimatePresence, useTransform } from 'framer-motion';
import styles from './ReadingHud.module.css';

type Heading = {
    id: string;
    title: string;
    top: number;
    level: number;
};

export default function ReadingHud({ 
    headings,
    isMobile,
    scrollContainerRef 
}: { 
    contentContainerRef?: React.RefObject<HTMLDivElement | null>, 
    headings: Heading[],
    isMobile: boolean,
    scrollContainerRef?: React.RefObject<HTMLElement | null>
}) {
    const [activeHeadings, setActiveHeadings] = useState<Set<string>>(new Set());
    const [showHud, setShowHud] = useState(false);
    
    // Target specific scroll container if provided (for Overlay), otherwise default (Window)
    const { scrollYProgress } = useScroll({ 
        container: scrollContainerRef,
        offset: ['start start', 'end end'] 
    });
    
    const springyProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
    const progressValue = useTransform(scrollYProgress, (p) => p);
    const translateY = useTransform(springyProgress, [0, 1], ['-100%', '0%']);

    useEffect(() => {
        const unsubscribe = progressValue.on('change', (latestProgress) => {
            
            let scrollTop = 0;
            let scrollHeight = 0;
            let clientHeight = 0;

            if (scrollContainerRef?.current) {
                const el = scrollContainerRef.current;
                scrollTop = el.scrollTop;
                scrollHeight = el.scrollHeight;
                clientHeight = el.clientHeight;
            } else {
                scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                scrollHeight = document.documentElement.scrollHeight;
                clientHeight = document.documentElement.clientHeight;
            }
            
            const documentScrollHeight = scrollHeight - clientHeight;
            
            setShowHud(scrollTop > 100 && latestProgress < 0.99);

            if (headings.length === 0 || documentScrollHeight <= 0) return;
            
            const currentlyActive = new Set<string>();

            for (let i = 0; i < headings.length; i++) {
                const heading = headings[i];
                const headingProgressPosition = heading.top / documentScrollHeight;
                if (latestProgress >= headingProgressPosition) {
                    currentlyActive.add(heading.id);
                }
            }
            
            setActiveHeadings(currentlyActive);
        });

        return () => unsubscribe();
    }, [headings, progressValue, scrollContainerRef]); 

    const handleMarkerClick = (headingId: string) => {
        const targetScrollPosition = headings.find(h => h.id === headingId)?.top;

        if (targetScrollPosition !== undefined) {
             if (scrollContainerRef?.current) {
                 scrollContainerRef.current.scrollTo({ top: targetScrollPosition, behavior: 'smooth' });
             } else {
                 window.scrollTo({ top: targetScrollPosition, behavior: 'smooth' });
             }
        }
    };

    if (isMobile) {
        return (
            <AnimatePresence>
                {showHud && (
                    <motion.aside
                        className={styles.readingHudMobile}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className={styles.mobileTrack}>
                            <motion.div className={styles.mobileProgress} style={{ scaleX: springyProgress }} /> 
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {showHud && headings.length > 0 && (
                <motion.aside
                    className={styles.readingHud}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className={styles.track}>
                        <motion.div className={styles.progress} style={{ translateY }} />
                    </div>
                    <div className={styles.markers}>
                        {headings.map((h) => {
                            const isActive = activeHeadings.has(h.id);
                            
                            let scrollHeight = 0;
                            let clientHeight = 0;
                            if (scrollContainerRef?.current) {
                                scrollHeight = scrollContainerRef.current.scrollHeight;
                                clientHeight = scrollContainerRef.current.clientHeight;
                            } else {
                                scrollHeight = document.documentElement.scrollHeight;
                                clientHeight = document.documentElement.clientHeight;
                            }
                            
                            const documentScrollHeight = scrollHeight - clientHeight;
                            if (documentScrollHeight <= 0) return null;
                            
                            const topPercentage = (h.top / documentScrollHeight) * 100;
                            const markerClass = h.level === 2 ? styles.markerH2 : '';

                            return (
                                <button
                                    key={h.id}
                                    className={`${styles.marker} ${markerClass} ${isActive ? styles.active : ''}`}
                                    style={{ 
                                        top: `${topPercentage}%`,
                                    }}
                                    onClick={() => handleMarkerClick(h.id)}
                                    data-title={h.title}
                                    aria-label={`Scroll to ${h.title}`}
                                >
                                    <div className={styles.markerDot} />
                                </button>
                            )
                        })}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};