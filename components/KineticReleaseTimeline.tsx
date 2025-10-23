// components/KineticReleaseTimeline.tsx
'use client';

import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { motion, useScroll, useInView, useTransform, MotionValue } from 'framer-motion';
import TimelineCard from './TimelineCard'; // <-- IMPORT THE NEW CARD
import styles from './KineticReleaseTimeline.module.css';

const TimelineItem = ({ release, index }: { release: any, index: number }) => {
    const itemRef = useRef(null);
    const cardIsInView = useInView(itemRef, { once: true, amount: 0.5 });
    const isLeft = index % 2 === 0;
    const variants = {
        hidden: { opacity: 0, x: isLeft ? -50 : 50, scale: 0.9 },
        visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div ref={itemRef} className={`${styles.timelineItemWrapper} ${isLeft ? styles.left : styles.right}`}>
            <motion.div variants={variants} initial="hidden" animate={cardIsInView ? "visible" : "hidden"}>
                <TimelineCard release={release} />
            </motion.div>
        </div>
    );
};

const TimelineDot = ({ position, scrollYProgress }: { position: number, scrollYProgress: MotionValue<number> }) => {
    const backgroundColor = useTransform( scrollYProgress, [position - 0.01, position], ['var(--border-color)', 'var(--accent)'] );
    const boxShadow = useTransform( scrollYProgress, [position - 0.01, position], ['0 0 0px 0 rgba(0,0,0,0)', '0 0 8px 0 var(--accent)'] );
    return ( <motion.div className={styles.dot} style={{ top: `${position * 100}%`, backgroundColor: backgroundColor, boxShadow: boxShadow, }} /> );
};

export default function KineticReleaseTimeline({ releases: allReleases }: { releases: any[] }) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [dotPositions, setDotPositions] = useState<number[]>([]);
    const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start 50%", "end 50%"], });
    const releasesForThisMonth = useMemo(() => {
        if (!allReleases) return [];
        const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
        return allReleases.filter(release => { const releaseDate = new Date(release.releaseDate); return releaseDate.getUTCMonth() === currentMonth && releaseDate.getUTCFullYear() === currentYear; }).sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    }, [allReleases]);

    useLayoutEffect(() => {
        if (timelineRef.current && releasesForThisMonth.length > 0) {
            const timeoutId = setTimeout(() => {
                const containerEl = timelineRef.current; if (!containerEl) return;
                const containerHeight = containerEl.scrollHeight;
                const itemElements = Array.from(containerEl.querySelectorAll(`.${styles.timelineItemWrapper}`));
                const positions = itemElements.map(el => { const item = el as HTMLElement; const top = item.offsetTop + (item.offsetHeight / 2); return top / containerHeight; });
                setDotPositions(positions);
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [releasesForThisMonth]);

    return (
        <div ref={timelineRef} className={styles.timelineContainer}>
            <div className={styles.timelineSpine}>
                <div className={styles.timelineSpineTrack} />
                <motion.div className={styles.timelineSpineProgress} style={{ scaleY: scrollYProgress }} />
                <div className={styles.dotsContainer}>
                    {dotPositions.map((pos, index) => ( <TimelineDot key={index} position={pos} scrollYProgress={scrollYProgress} /> ))}
                </div>
            </div>
            <div className={styles.timelineItemsWrapper}>
                {releasesForThisMonth.length > 0 ? (
                    releasesForThisMonth.map((release, index) => ( <TimelineItem key={release._id} release={release} index={index} /> ))
                ) : (
                    <motion.div style={{ paddingTop: '20vh', textAlign: 'center', color: 'var(--text-secondary)', width: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}>يجري تحديث جدول الإصدارات. عد قريبًا.</motion.div>
                )}
            </div>
        </div>
    );
}





