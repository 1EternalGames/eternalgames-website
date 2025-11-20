// components/ArticleCard.tsx
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TagLinks from './TagLinks';
import { m } from 'framer-motion'; 
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
    disableLivingEffect?: boolean; 
};

const ArticleCardComponent = ({ article, layoutIdPrefix, isPriority = false, disableLivingEffect = false }: ArticleCardProps) => {
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix); 
    
    // THE FIX: Explicitly typed for HTMLAnchorElement
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLAnchorElement>();

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
        if ((e.target as HTMLElement).closest('a, button, [role="button"]')) {
            return;
        }
        if (e.ctrlKey || e.metaKey) return;
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

    const wrapperProps = disableLivingEffect ? {} : {
        ref: livingCardRef,
        onMouseMove: livingCardAnimation.onMouseMove,
        onMouseEnter: () => { livingCardAnimation.onMouseEnter(); handleMouseEnter(); },
        onMouseLeave: livingCardAnimation.onMouseLeave,
        onTouchStart: livingCardAnimation.onTouchStart,
        onTouchEnd: livingCardAnimation.onTouchEnd,
        onTouchCancel: livingCardAnimation.onTouchCancel,
    };
    
    const motionStyle = disableLivingEffect 
        ? { cursor: 'pointer' } 
        : { ...livingCardAnimation.style, cursor: 'pointer' };

    return (
        <m.a
            href={linkPath}
            layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`}
            onClick={handleClick}
            className={`${styles.livingCardWrapper} no-underline`}
            {...wrapperProps}
            style={{ ...motionStyle, display: 'block' }}
        >
            <div
                className={styles.articleCard}
            >
                <m.div className={styles.imageContainer} layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`}>
                    {hasScore && ( <m.div className={styles.score}>{article.score!.toFixed(1)}</m.div> )}
                    <Image 
                        loader={sanityLoader}
                        src={imageSource}
                        alt={article.title}
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                        className={styles.cardImage}
                        style={{ objectFit: 'cover' }}
                        placeholder="blur" 
                        blurDataURL={article.blurDataURL}
                        priority={isPriority}
                    />
                </m.div>
                <m.div className={styles.cardContent}>
                    <div className={styles.cardTitleLink}>
                        <m.h3 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`}>{article.title}</m.h3>
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
                        <TagLinks tags={article.tags.slice(0, 5).map(tag => tag.title)} small={true} />
                    </div>
                </m.div>
            </div>
        </m.a>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;