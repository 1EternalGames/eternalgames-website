// components/news/NewsGridCard.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { Calendar03Icon } from '@/components/icons';
import styles from './NewsGridCard.module.css';
import CreatorCredit from '../CreatorCredit';

type NewsGridCardProps = {
    item: CardProps;
    isPriority?: boolean;
    layoutIdPrefix: string;
};

const NewsGridCardComponent = ({ item, isPriority = false, layoutIdPrefix }: NewsGridCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const linkPath = `/news/${item.slug}`;
    
    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button, [role="button"]')) {
            return;
        }
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const handleMouseEnter = () => {
        router.prefetch(linkPath);
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;

    return (
        <motion.div
            ref={livingCardRef}
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={() => { livingCardAnimation.onHoverStart(); handleMouseEnter(); }}
            onMouseLeave={livingCardAnimation.onHoverEnd}
            onClick={handleClick}
            className={styles.cardContainer}
            style={livingCardAnimation.style}
        >
            <motion.div
                layoutId={`${layoutIdPrefix}-card-container-${item.legacyId}`}
                className={styles.newsCard}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <div className={`${styles.cardLink} no-underline`}>
                    <div className={styles.imageContentWrapper}>
                        <motion.div 
                            className={styles.imageContainer} 
                            layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`}
                        >
                            <Image 
                                loader={sanityLoader}
                                src={imageSource}
                                alt={item.title}
                                width={300}
                                height={180}
                                sizes="(max-width: 768px) 100px, 140px"
                                className={styles.cardImage}
                                style={{ objectFit: 'cover' }}
                                placeholder="blur" 
                                blurDataURL={item.blurDataURL}
                                priority={isPriority}
                            />
                        </motion.div>
                        <div className={styles.cardInfo}>
                            <motion.h3 
                                className={styles.cardTitle}
                                layoutId={`${layoutIdPrefix}-card-title-${item.legacyId}`}
                            >
                                {item.title}
                            </motion.h3>
                        </div>
                    </div>
                    
                    <div className={styles.cardMetadata}>
                        <CreatorCredit label="بواسطة" creators={item.authors} small />
                        {item.date && (
                            <div className={styles.cardDate}>
                                <Calendar03Icon className={styles.metadataIcon} />
                                <span>{item.date}</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const NewsGridCard = memo(NewsGridCardComponent);
export default NewsGridCard;