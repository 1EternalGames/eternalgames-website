// components/ArticleCard.tsx
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TagLinks from './TagLinks';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import CreatorCredit from './CreatorCredit';
import { CardProps } from '@/types';
import { sanityLoader } from '@/lib/sanity.loader';
import { Calendar03Icon } from '@/components/icons/index';
import styles from './ArticleCard.module.css';

type ArticleCardProps = {
    article: CardProps & { width?: number; height?: number; mainImageRef?: any; };
    layoutIdPrefix: string;
    isPriority?: boolean;
    isArticle?: boolean;
};

const ArticleCardComponent = ({ article, layoutIdPrefix, isPriority = false, isArticle = false }: ArticleCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const type = article.type;
    const isReview = type === 'review';

    const getLinkBasePath = () => {
        switch (type) {
            case 'review': return '/reviews/';
            case 'article': return '/articles/';
            case 'news': return '/news/';
            default: return '/';
        }
    };

    const linkPath = `${getLinkBasePath()}${article.slug}`;
    
    const handleClick = (e: React.MouseEvent) => {
        // If the original click target or its parent is an interactive element (a nested link or button), let it handle the event.
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

    const hasScore = isReview && typeof article.score === 'number';
    
    const imageSource = article.imageUrl;
    if (!imageSource) return null;

    return (
        <motion.div
            ref={livingCardRef}
            onMouseMove={livingCardAnimation.onMouseMove}
            onMouseEnter={() => { livingCardAnimation.onHoverStart(); handleMouseEnter(); }}
            onMouseLeave={livingCardAnimation.onHoverEnd}
            className={styles.livingCardWrapper}
            style={livingCardAnimation.style}
        >
            <Link href={linkPath} onClick={handleClick} className={`${styles.cardLink} no-underline`}>
                <motion.div
                    layoutId={`${layoutIdPrefix}-card-container-${article.id}`}
                    className={styles.articleCard}
                >
                    <motion.div className={styles.imageContainer} layoutId={`${layoutIdPrefix}-card-image-${article.id}`}>
                        {hasScore && ( <motion.div className={styles.score}>{article.score!.toFixed(1)}</motion.div> )}
                        <Image 
                            loader={sanityLoader}
                            src={imageSource}
                            alt={article.title}
                            width={800} // Default width, loader will override
                            height={450} // Default height, loader will override
                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                            className={styles.cardImage}
                            style={{ objectFit: 'cover' }}
                            placeholder="blur" 
                            blurDataURL={article.blurDataURL}
                            priority={isPriority}
                        />
                    </motion.div>
                    <motion.div className={styles.cardContent}>
                        <div className={styles.cardTitleLink}> {/* Re-purposed class for styling */}
                            <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${article.id}`}>{article.title}</motion.h3>
                        </div>
                        <div className={styles.cardMetadata}>
                            <CreatorCredit label="بقلم" creators={article.authors} />
                            {article.date && (
                                <p className={styles.cardDate}>
                                    <Calendar03Icon className={styles.metadataIcon} />
                                    <span>{article.date}</span>
                                </p>
                            )}
                        </div>
                        <div className={styles.tagContainer}>
                            <TagLinks tags={article.tags.map(tag => tag.title)} small={true} />
                        </div>
                    </motion.div>
                </motion.div>
            </Link>
        </motion.div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;