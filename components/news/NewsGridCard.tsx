// components/news/NewsGridCard.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { Calendar03Icon } from '@/components/icons';
import styles from './NewsGridCard.module.css';
import CreatorCredit from '../CreatorCredit';
import { translateTag } from '@/lib/translations';

type NewsGridCardProps = {
    item: CardProps;
    isPriority?: boolean;
    layoutIdPrefix: string;
};

const typeLabelMap: Record<string, string> = {
    'official': 'رسمي',
    'rumor': 'إشاعة',
    'leak': 'تسريب'
};

const NewsGridCardComponent = ({ item, isPriority = false, layoutIdPrefix }: NewsGridCardProps) => {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    // THE FIX: Typed as HTMLDivElement since the ref is on the wrapper div
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();

    const linkPath = `/news/${item.slug}`;
    
    const handleClick = (e: React.MouseEvent) => {
        // Allow default Link behavior (navigation), just set the layout prefix
        setPrefix(layoutIdPrefix);
    };

    const imageSource = item.imageUrl;
    if (!imageSource) return null;
    
    const newsType = item.newsType || 'official';

    return (
        <motion.div
            ref={livingCardRef}
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={livingCardAnimation.onMouseEnter}
            onMouseLeave={livingCardAnimation.onMouseLeave}
            onTouchStart={livingCardAnimation.onTouchStart}
            onTouchEnd={livingCardAnimation.onTouchEnd}
            onTouchCancel={livingCardAnimation.onTouchCancel}
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
                <Link 
                    href={linkPath} 
                    className={`${styles.cardLink} no-underline`}
                    onClick={handleClick}
                    prefetch={false} // THE FIX: Disable prefetch to prevent request spam
                >
                    <div className={styles.imageContentWrapper}>
                        <motion.div 
                            className={styles.imageContainer} 
                            layoutId={`${layoutIdPrefix}-card-image-${item.legacyId}`}
                        >
                            {/* Classification Badge on Image */}
                            <span className={`${styles.imageBadge} ${styles[newsType]}`}>
                                {typeLabelMap[newsType]}
                            </span>
                            
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
                            {item.category && (
                                <p className={styles.cardCategory}>{translateTag(item.category)}</p>
                            )}
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
                </Link>
            </motion.div>
        </motion.div>
    );
};

const NewsGridCard = memo(NewsGridCardComponent);
export default NewsGridCard;