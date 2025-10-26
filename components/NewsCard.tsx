// components/NewsCard.tsx
'use client';

import { NewsItem } from '@/lib/data';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useLivingCard } from '@/hooks/useLivingCard';
import styles from './NewsCard.module.css';

const NewsCardComponent = ({ item, isLead = false }: { item: any, isLead?: boolean }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard({ isLead });
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = 'news-grid';

    const linkPath = `/news/${item.slug}`;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const handleMouseEnter = () => {
        router.prefetch(linkPath);
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;

    const baseUrl = imageSource.split('?')[0];
    const imageUrl = `${baseUrl}?w=600&auto=format&q=80`;

    return (
        <motion.div 
            ref={livingCardRef} 
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={() => { livingCardAnimation.onHoverStart(); handleMouseEnter(); }}
            onMouseLeave={livingCardAnimation.onHoverEnd}
            className={styles.livingCardWrapper}
            style={livingCardAnimation.style}
        >
            <a href={linkPath} onClick={handleClick} className={`${styles.newsCardLink} no-underline`}>
                <motion.div
                    className={`${styles.newsCard} ${isLead ? styles.leadNewsCard : ''}`}
                    layoutId={`${layoutIdPrefix}-card-container-${item.id}`}
                >
                    <motion.div
                        className={styles.imageContainer}
                        style={{ transform: 'translateZ(20px)' }}
                        layoutId={`${layoutIdPrefix}-card-image-${item.id}`}
                    >
                        <Image 
                            src={imageUrl} 
                            alt={item.title} 
                            width={item.width || 1600}
                            height={item.height || 900}
                            sizes={isLead ? '100vw' : '30vw'}
                            className={styles.cardImage} 
                            placeholder="blur" 
                            blurDataURL={item.blurDataURL}
                            unoptimized
                        />
                    </motion.div>
                    <div className={styles.cardContent} style={{ transform: 'translateZ(40px)' }}>
                        <p className={styles.category}>{item.category}</p>
                        <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${item.id}`}>{item.title}</motion.h3>
                        {item.date && <p className={styles.cardDate}>{item.date.split(' - ')[0]}</p>}
                    </div>
                </motion.div>
            </a>
        </motion.div>
    );
};

export default memo(NewsCardComponent);