// components/news/NewsHero.tsx
'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CardProps } from '@/types';
import styles from './NewsHero.module.css';
import { Calendar03Icon } from '@/components/icons';
import CreatorCredit from '@/components/CreatorCredit';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useRouter } from 'next/navigation';

const transition = { type: 'spring' as const, stiffness: 400, damping: 50 };

const titleContainerVariants = {
    animate: { transition: { staggerChildren: 0.08 } },
};

const wordVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { ...transition, duration: 0.8 } },
};

const typeLabelMap: Record<string, string> = {
    'official': 'رسمي',
    'rumor': 'إشاعة',
    'leak': 'تسريب'
};

const AnimatedStory = memo(({ item, isActive, layoutIdPrefix }: { item: CardProps; isActive: boolean, layoutIdPrefix: string }) => {
    // THE FIX: Use newsType for the label instead of the generic tag
    const newsType = item.newsType || 'official';
    const label = typeLabelMap[newsType] || 'أخبار';

    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(`/news/${item.slug}`, { scroll: false });
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div 
                    key={item.id}
                    className={styles.activeStoryContainer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.textContent}>
                        {/* Applied dynamic class based on newsType */}
                        <p className={`${styles.storyCategory} ${styles[newsType]}`}>
                            {label}
                        </p>
                        <a 
                            href={`/news/${item.slug}`}
                            onClick={handleClick}
                            className={`${styles.storyLink} no-underline`}
                        >
                            <motion.h1 
                                className={styles.storyTitle} 
                                layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`}
                                variants={titleContainerVariants}
                                initial="initial"
                                animate="animate"
                            >
                                {item.title.split(' ').map((word, index) => (
                                    <motion.span key={index} variants={wordVariants} style={{ display: 'inline-block', marginRight: '0.6rem' }}>
                                        {word}
                                    </motion.span>
                                ))}
                            </motion.h1>
                        </a>
                        <div className={styles.storyMeta}>
                            <CreatorCredit label="بواسطة" creators={item.authors} small disableLink />
                            <span className={styles.storyMetaDate}>
                                 <Calendar03Icon style={{width:'16px', height: '16px', color: 'var(--accent)'}} /> {item.date}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
AnimatedStory.displayName = "AnimatedStory";


const HeroBackground = memo(({ imageUrl, alt, layoutId, legacyId, layoutIdPrefix }: { imageUrl: string; alt: string; layoutId: string; legacyId: number; layoutIdPrefix: string }) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    
    // Allow clicking the background too
    const handleClick = () => {
        setPrefix(layoutIdPrefix);
    };

    return (
        <motion.div 
            key={imageUrl} 
            className={styles.heroBackground} 
            layoutId={`${layoutIdPrefix}-card-container-${legacyId}`} // Transition container
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleClick}
        >
             <motion.div 
                style={{ position: 'relative', width: '100%', height: '100%' }}
                layoutId={`${layoutIdPrefix}-card-image-${legacyId}`} // Transition image
             >
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    priority
                    style={{ objectFit: 'cover', filter: 'grayscale(10%) brightness(0.7)'}}
                    sizes="100vw"
                />
             </motion.div>
        </motion.div>
    );
});
HeroBackground.displayName = "HeroBackground";


export default function NewsHero({ newsItems }: { newsItems: CardProps[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    useEffect(() => {
        if (isPaused || newsItems.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isPaused, newsItems.length]);
    
    if (newsItems.length === 0) return null;

    const activeItem = newsItems[activeIndex];
    const layoutIdPrefix = "news-hero";

    return (
        <div 
            className={styles.heroContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence>
                 <HeroBackground 
                    key={activeItem.id} 
                    imageUrl={activeItem.imageUrl} 
                    alt={activeItem.title} 
                    layoutId={`${layoutIdPrefix}-card-image-${activeItem.legacyId}`} 
                    legacyId={activeItem.legacyId}
                    layoutIdPrefix={layoutIdPrefix}
                 />
            </AnimatePresence>
            
            <div className={styles.heroOverlay} />

            <div className={`container ${styles.heroContentWrapper}`}>
                <AnimatePresence mode="wait">
                    <AnimatedStory key={activeItem.id} item={activeItem} isActive={true} layoutIdPrefix={layoutIdPrefix} />
                </AnimatePresence>
            </div>

            <div className={styles.controlsContainer}>
                {newsItems.map((item, index) => (
                    <button
                        key={item.id}
                        className={`${styles.progressDot} ${activeIndex === index ? styles.active : ''}`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Go to news slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}