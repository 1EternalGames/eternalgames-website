// components/TriptychHero.tsx
'use client';
import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionStyle } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import styles from './TriptychHero.module.css';

const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };

const TriptychPanel = ({ item, isCenter, defaultCategory }: { item: any, isCenter?: boolean, defaultCategory: string }) => {
    if (!item?.mainImage?.url) {
        return (
            <div className={styles.triptychPanelBgContainer} style={{backgroundColor: 'var(--border-color)'}}>
                <div className={styles.triptychPanelOverlay} />
            </div>
        );
    }

    const getLink = () => {
        switch(item._type) {
            case 'review': return `/reviews/${item.slug}`;
            case 'news': return `/news/${item.slug}`;
            case 'article': return `/articles/${item.slug}`;
            default: return '/';
        }
    };

    const baseUrl = item.mainImage.url.split('?')[0];
    const imageUrl = `${baseUrl}?w=1200&auto=format&q=80`;

    return (
        <Link href={getLink()} className={`${styles.triptychPanelLink} no-underline`}>
            <div className={styles.triptychPanelBgContainer}>
                <Image
                    src={imageUrl}
                    alt={item.title}
                    fill
                    sizes="50vw"
                    style={{ objectFit: 'cover' }}
                    className={styles.triptychPanelBg}
                    priority
                    placeholder="blur"
                    blurDataURL={item.mainImage.blurDataURL}
                    unoptimized
                />
            </div>
            <div className={styles.triptychPanelOverlay} />
            <div className={styles.triptychPanelContent}>
                <p className={styles.triptychPanelCategory}>{defaultCategory}</p>
                <h3>{item.title}</h3>
            </div>
        </Link>
    );
};

interface TriptychHeroProps {
    heroContent: any;
    panelStyles: {
        left: MotionStyle;
        center: MotionStyle;
        right: MotionStyle;
    };
}

export default function TriptychHero({ heroContent, panelStyles }: TriptychHeroProps) {
    const ref = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const { featuredReview, latestNews, featuredArticle } = heroContent || {};

    const smoothMouseX = useSpring(mouseX, springConfig);
    const smoothMouseY = useSpring(mouseY, springConfig);
    
    // --- THE DEFINITIVE TILT SETTINGS ---
    const rotateX = useTransform(smoothMouseY, [0, 1], [12, -12]);
    const centerRotateX = useTransform(smoothMouseY, [0, 1], [8, -8]);
    const rotateY = useTransform(smoothMouseX, [0, 1], [-12, 12]);
    const centerRotateY = useTransform(smoothMouseX, [0, 1], [-8, 8]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };
    const handleMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5); };

    return (
        <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={styles.triptychHeroContainer}>
            <motion.div className={`${styles.triptychPanel} ${styles.left}`} style={{ ...panelStyles.left, rotateX, rotateY }}>
                <TriptychPanel item={latestNews} defaultCategory="آخر الأخبار" />
            </motion.div>
            <motion.div className={`${styles.triptychPanel} ${styles.center}`} style={{ ...panelStyles.center, rotateX: centerRotateX, rotateY: centerRotateY }}>
                <TriptychPanel item={featuredReview} isCenter defaultCategory="مراجعة مميزة" />
            </motion.div>
            <motion.div className={`${styles.triptychPanel} ${styles.right}`} style={{ ...panelStyles.right, rotateX, rotateY }}>
                <TriptychPanel item={featuredArticle} defaultCategory="من المقالات" />
            </motion.div>
            <div className={styles.scrollPrompt}>
                <span>مرر لاستكشاف الديوان</span>
                <div className={styles.scrollPromptLine}></div>
            </div>
        </div>
    );
}