// components/ArticleCard.tsx
'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TagLinks from './TagLinks';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { getCreatorUsernames } from '@/app/actions/creatorActions';
import { CardProps } from '@/types';
import styles from './ArticleCard.module.css';

type AuthorLinkProps = { name: string; prismaId: string };
const AuthorLinkComponent = ({ name, prismaId }: AuthorLinkProps) => {
    const [username, setUsername] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (prismaId) {
            getCreatorUsernames([prismaId]).then(result => {
                const fetchedUsername = result[prismaId];
                if (fetchedUsername) {
                    setUsername(fetchedUsername);
                }
            });
        }
    }, [prismaId]);

    if (username) {
        return (
            <span className={styles.authorLink}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/creators/${username}`, { scroll: true });
                }}
            >
                {name}
            </span>
        );
    }

    return <span>{name}</span>;
};
const AuthorLink = memo(AuthorLinkComponent);


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
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(linkPath, { scroll: false });
    };

    const handleMouseEnter = () => {
        router.prefetch(linkPath);
    };

    const hasScore = isReview && typeof article.score === 'number';
    const authorName = article.author || 'مجهول';
    const authorPrismaId = article.authorPrismaId;
    const authorLabel = isReview ? 'مراجعة بواسطة ' : (type === 'news' ? 'بقلم ' : 'بقلم ');

    // --- THE DEFINITIVE FIX: ---
    // The source URL from the adapter might already have query params. We must strip them
    // before appending our own desired params to avoid conflicts and errors.
    const imageSource = article.imageUrl;
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
            <a href={linkPath} onClick={handleClick} className={styles.cardLink}>
                <motion.div
                    layoutId={`${layoutIdPrefix}-card-container-${article.id}`}
                    className={styles.articleCard}
                >
                    <motion.div className={styles.imageContainer} layoutId={`${layoutIdPrefix}-card-image-${article.id}`}>
                        {hasScore && ( <motion.div className={styles.score}>{article.score.toFixed(1)}</motion.div> )}
                        <Image 
                            src={imageUrl}
                            alt={article.title}
                            width={article.width || 1600}
                            height={article.height || 900}
                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                            className={styles.cardImage}
                            style={{ objectFit: 'cover' }}
                            placeholder="blur" 
                            blurDataURL={article.blurDataURL}
                            priority={isPriority}
                            unoptimized
                        />
                    </motion.div>
                    <motion.div className={styles.cardContent}>
                        <div>
                            <div className={styles.cardTitleLink}>
                                <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${article.id}`}>{article.title}</motion.h3>
                            </div>
                            <p className={styles.cardMetadata}>
                                {authorLabel}
                                {authorName !== 'مجهول' && authorPrismaId ? (
                                    <AuthorLink name={authorName} prismaId={authorPrismaId} />
                                ) : (
                                    <span>{authorName}</span>
                                )}
                                {article.date && ` • ${article.date}`}
                            </p>
                        </div>
                        <div className={styles.tagContainer}>
                            <TagLinks tags={article.tags} small={true} />
                        </div>
                    </motion.div>
                </motion.div>
            </a>
        </motion.div>
    );
};

const ArticleCard = memo(ArticleCardComponent);
export default ArticleCard;