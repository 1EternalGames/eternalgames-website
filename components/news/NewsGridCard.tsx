// components/news/NewsGridCard.tsx
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
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
};

const NewsGridCardComponent = ({ item, isPriority = false }: NewsGridCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const linkPath = `/news/${item.slug}`;
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix('news-grid');
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
            className={styles.cardContainer}
            style={livingCardAnimation.style}
        >
            <motion.div
                layoutId={`news-grid-card-container-${item.id}`}
                className={styles.newsCard}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <Link href={linkPath} onClick={handleClick} className={`${styles.cardLink} no-underline`}>
                    <div className={styles.imageContentWrapper}>
                        <motion.div 
                            className={styles.imageContainer} 
                            layoutId={`news-grid-card-image-${item.id}`}
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
                            {/* ENHANCEMENT: Tactile Tag Interaction */}
                            <motion.p className={styles.cardCategory}>
                                {item.category || 'أخبار'}
                            </motion.p>
                            <motion.h3 
                                className={styles.cardTitle}
                                layoutId={`news-grid-card-title-${item.id}`}
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


