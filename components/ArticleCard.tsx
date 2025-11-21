// components/ArticleCard.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import TagLinks from './TagLinks';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useScrollStore } from '@/lib/scrollStore'; // <-- IMPORTED
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
    const setScrollPos = useScrollStore((state) => state.setScrollPos); // <-- USE STORE
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const type = article.type;
    
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
        e.preventDefault();
        
        // 1. Capture current scroll position before navigation
        setScrollPos(window.scrollY);
        
        // 2. Set layout prefix
        setPrefix(layoutIdPrefix);
        
        // 3. Navigate with scroll: false to prevent default browser jump behavior,
        //    allowing our Template to handle the visual freeze/reset.
        router.push(linkPath, { scroll: false });
    };

    const handleMouseEnter = () => {
        router.prefetch(linkPath);
    };

    const hasScore = type === 'review' && typeof article.score === 'number';
    const imageSource = article.imageUrl;
    if (!imageSource) return null;

    const springTransition = { type: 'spring' as const, stiffness: 80, damping: 20, mass: 1.2 };

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
        ? { cursor: 'pointer', position: 'relative', zIndex: 20 } 
        : { ...livingCardAnimation.style, cursor: 'pointer', position: 'relative', zIndex: 20 };

    return (
        <motion.div
            layoutId={`${layoutIdPrefix}-card-container-${article.legacyId}`}
            transition={springTransition}
            onClick={handleClick}
            className={styles.livingCardWrapper}
            {...wrapperProps}
            style={motionStyle as any}
        >
            <div className={styles.articleCard}>
                <motion.div 
                    className={styles.imageContainer} 
                    layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`}
                    transition={springTransition}
                >
                    {hasScore && ( <motion.div className={styles.score}>{article.score!.toFixed(1)}</motion.div> )}
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
                </motion.div>
                <motion.div className={styles.cardContent}>
                    <div className={styles.cardTitleLink}>
                        <motion.h3 
                            layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`}
                            transition={springTransition}
                        >
                            {article.title}
                        </motion.h3>
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
                </motion.div>
            </div>
        </motion.div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;