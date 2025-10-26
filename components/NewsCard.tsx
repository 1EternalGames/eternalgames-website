// components/NewsCard.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import styles from './NewsCard.module.css';

const NewsCardComponent = ({ item, isLead = false }: { item: any, isLead?: boolean }) => {
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
    const imageParams = isLead ? 'w=1200&h=675&fit=crop' : 'w=800&h=800&fit=crop';
    const imageUrl = `${baseUrl}?${imageParams}&auto=format&q=80`;

    return (
        <a href={linkPath} onClick={handleClick} onMouseEnter={handleMouseEnter} className={`${styles.newsCardLink} no-underline`}>
            <motion.div
                className={`${styles.newsCard} ${isLead ? styles.leadNewsCard : ''}`}
                layoutId={`${layoutIdPrefix}-card-container-${item.id}`}
            >
                <motion.div
                    className={styles.imageContainer}
                    layoutId={`${layoutIdPrefix}-card-image-${item.id}`}
                >
                    <Image 
                        src={imageUrl} 
                        alt={item.title} 
                        width={isLead ? 1200 : 800}
                        height={isLead ? 675 : 800}
                        sizes={isLead ? '(max-width: 1024px) 90vw, 60vw' : '(max-width: 768px) 90vw, 30vw'}
                        className={styles.cardImage} 
                        placeholder="blur" 
                        blurDataURL={item.blurDataURL}
                        unoptimized
                    />
                </motion.div>
                <div className={styles.cardContent}>
                    <p className={styles.category}>{item.category}</p>
                    <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${item.id}`}>{item.title}</motion.h3>
                    {item.date && <p className={styles.cardDate}>{item.date.split(' - ')[0]}</p>}
                </div>
            </motion.div>
        </a>
    );
};

export default memo(NewsCardComponent);