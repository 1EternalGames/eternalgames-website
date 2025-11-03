// components/ReadingHud.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import styles from './ReadingHud.module.css'; // <-- IMPORTED

type Heading = {
    id: string;
    title: string;
    top: number;
};

export default function ReadingHud({ contentContainerRef, headings }: { contentContainerRef: React.RefObject<HTMLDivElement | null>, headings: Heading[] }) {
    const [activeHeadings, setActiveHeadings] = useState<Set<string>>(new Set());
    const [isVisible, setIsVisible] = useState(false);
    const scrollableHeightRef = useRef(0);
    const { scrollYProgress } = useScroll({ target: contentContainerRef, offset: ['start start', 'end end'] });
    const springyProgress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

    useEffect(() => {
        const contentElement = contentContainerRef.current;
        if (!contentElement || headings.length === 0) {
            setIsVisible(false);
            return;
        }

        const newScrollableHeight = contentElement.scrollHeight - window.innerHeight;
        scrollableHeightRef.current = Math.max(1, newScrollableHeight);

        const visibilityObserver = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin: "0px 0px -40% 0px" });
        visibilityObserver.observe(contentElement);

        const unsubscribeFromScroll = scrollYProgress.on("change", (latestProgress) => {
            const currentlyActive = new Set<string>();
            headings.forEach(heading => {
                const headingProgressPosition = heading.top / scrollableHeightRef.current;
                if (latestProgress >= headingProgressPosition) {
                    currentlyActive.add(heading.id);
                }
            });
            setActiveHeadings(currentlyActive);
        });

        return () => {
            visibilityObserver.disconnect();
            unsubscribeFromScroll();
        };
    }, [contentContainerRef, headings, scrollYProgress]);

    const handleMarkerClick = (headingId: string) => {
        const headingElement = document.getElementById(headingId);
        if (!headingElement) return;
        const navbarOffset = 80;
        const elementTop = headingElement.getBoundingClientRect().top + window.scrollY;
        const targetScrollPosition = elementTop - navbarOffset;
        window.scrollTo({ top: targetScrollPosition, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {isVisible && headings.length > 0 && (
                <motion.aside
                    className={styles.readingHud}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className={styles.track}>
                        <motion.div className={styles.progress} style={{ scaleY: springyProgress }} />
                    </div>
                    <div className={styles.markers}>
                        {headings.map((h) => {
                            const isActive = activeHeadings.has(h.id);
                            return (
                                <button
                                    key={h.id}
                                    className={`${styles.marker} ${isActive ? styles.active : ''}`}
                                    style={{ top: `${(h.top / scrollableHeightRef.current) * 100}%` }}
                                    onClick={() => handleMarkerClick(h.id)}
                                    data-title={h.title}
                                    aria-label={`Scroll to ${h.title}`}
                                />
                            )
                        })}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};


