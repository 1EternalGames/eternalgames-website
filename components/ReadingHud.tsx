// components/ReadingHud.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence, MotionValue, useTransform } from 'framer-motion';
import styles from './ReadingHud.module.css';

type Heading = {
    id: string;
    title: string;
    top: number;
};

// We don't need a custom hook; useScroll with a null target handles window scroll.
export default function ReadingHud({ 
    contentContainerRef, 
    headings,
    isMobile 
}: { 
    contentContainerRef: React.RefObject<HTMLDivElement | null>, 
    headings: Heading[],
    isMobile: boolean
}) {
    const [activeHeadings, setActiveHeadings] = useState<Set<string>>(new Set());
    const [showHud, setShowHud] = useState(false);
    
    const { scrollYProgress } = useScroll({ offset: ['start start', 'end end'] });
    
    const springyProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
    const progressValue = useTransform(scrollYProgress, (p) => p); // Raw progress MotionValue

    // THE FIX: Create a new MotionValue for translateY animation.
    const translateY = useTransform(springyProgress, [0, 1], ['-100%', '0%']);

    useEffect(() => {
        const unsubscribe = progressValue.on('change', (latestProgress) => {
            
            const documentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const documentScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            setShowHud(documentScrollTop > 100 && latestProgress < 0.99);

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
    }, [headings, progressValue, contentContainerRef]); 

    const handleMarkerClick = (headingId: string) => {
        const targetScrollPosition = headings.find(h => h.id === headingId)?.top;

        if (targetScrollPosition !== undefined) {
             window.scrollTo({ top: targetScrollPosition, behavior: 'smooth' });
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
                        {/* THE FIX: Apply the new translateY style instead of scaleY */}
                        <motion.div className={styles.progress} style={{ translateY }} />
                    </div>
                    <div className={styles.markers}>
                        {headings.map((h) => {
                            const isActive = activeHeadings.has(h.id);
                            
                            const documentScrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                            if (documentScrollHeight <= 0) return null;
                            
                            const topPercentage = (h.top / documentScrollHeight) * 100;
                            
                            return (
                                <button
                                    key={h.id}
                                    className={`${styles.marker} ${isActive ? styles.active : ''}`}
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