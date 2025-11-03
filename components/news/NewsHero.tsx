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
import { translateTag } from '@/lib/translations';

const transition = { type: 'spring' as const, stiffness: 400, damping: 50 };

const titleContainerVariants = {
    animate: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const wordVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { ...transition, duration: 0.8 } },
};

const AnimatedStory = memo(({ item, isActive }: { item: CardProps; isActive: boolean }) => {
    const primaryTag = item.tags && item.tags.length > 0 ? translateTag(item.tags[0].title) : 'أخبار';

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
                        <p className={styles.storyCategory}>{primaryTag}</p>
                        <Link href={`/news/${item.slug}`} className={`${styles.storyLink} no-underline`}>
                            <motion.h1 
                                className={styles.storyTitle} 
                                layoutId={`news-hero-title-${item.id}`}
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
                        </Link>
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


const HeroBackground = memo(({ imageUrl, alt }: { imageUrl: string; alt: string; }) => {
    return (
        <motion.div 
            key={imageUrl} 
            className={styles.heroBackground} 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
             <Image
                src={imageUrl}
                alt={alt}
                fill
                priority
                style={{ 
                    objectFit: 'cover', 
                    filter: 'grayscale(10%) brightness(0.7)',
                }}
                sizes="100vw"
            />
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
        }, 6000);
        return () => clearInterval(interval);
    }, [isPaused, newsItems.length]);
    
    if (newsItems.length === 0) return null;

    const activeItem = newsItems[activeIndex];

    return (
        <div 
            className={styles.heroContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence>
                 <HeroBackground key={activeItem.id} imageUrl={activeItem.imageUrl} alt={activeItem.title} />
            </AnimatePresence>
            
            <div className={styles.heroOverlay} />

            <div className={`container ${styles.heroContentWrapper}`}>
                <AnimatePresence mode="wait">
                    <AnimatedStory key={activeItem.id} item={activeItem} isActive={true} />
                </AnimatePresence>
            </div>

            <div className={styles.controlsContainer}>
                {newsItems.map((item, index) => (
                    <motion.div
                        key={item.id}
                        className={`${styles.progressDot} ${activeIndex === index ? styles.active : ''}`}
                        onClick={() => setActiveIndex(index)}
                        whileHover={{ scale: 1.6 }}
                        whileTap={{ scale: 0.8 }}
                        transition={transition}
                    />
                ))}
            </div>
        </div>
    );
}