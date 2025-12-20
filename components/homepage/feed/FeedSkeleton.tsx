// components/homepage/feed/FeedSkeleton.tsx
import React from 'react';
import styles from './FeedSkeleton.module.css';

const SkeletonBlock = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <div className={`${styles.skeletonBlock} ${className || ''}`} style={style}></div>
);

const ArticleCardSkeleton = () => (
    <div className={styles.articleCardSkeleton}>
        <SkeletonBlock className={styles.imageSkeleton} />
        <div className={styles.contentSkeleton}>
            <SkeletonBlock style={{ width: '80%', height: '24px' }} />
            <SkeletonBlock style={{ width: '50%', height: '16px' }} />
        </div>
    </div>
);

const NewsItemSkeleton = () => (
    <div className={styles.newsItemSkeleton}>
        <SkeletonBlock style={{ width: '80px', height: '50px', borderRadius: '6px' }} />
        <div className={styles.newsContentSkeleton}>
            <SkeletonBlock style={{ width: '40%', height: '12px' }} />
            <SkeletonBlock style={{ width: '90%', height: '16px' }} />
        </div>
    </div>
);

const FeedSkeleton = () => {
    return (
        <div className={styles.feedsGridSkeleton}>
            {/* Left Column (Articles) */}
            <div className={styles.feedColumnSkeleton}>
                <SkeletonBlock style={{ height: '40px', width: '200px', marginBottom: '2rem' }} />
                <div className={styles.topSectionSkeleton}>
                    <ArticleCardSkeleton />
                    <ArticleCardSkeleton />
                </div>
                <div className={styles.latestSectionSkeleton}>
                    <SkeletonBlock style={{ height: '20px', width: '150px', marginBottom: '1.5rem' }} />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                </div>
            </div>
            {/* Right Column (News) */}
            <div className={styles.feedColumnSkeleton}>
                <SkeletonBlock style={{ height: '40px', width: '200px', marginBottom: '2rem' }} />
                <div className={styles.topSectionSkeleton}>
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                </div>
                <div className={styles.latestSectionSkeleton}>
                    <SkeletonBlock style={{ height: '20px', width: '150px', marginBottom: '1.5rem' }} />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                    <NewsItemSkeleton />
                </div>
            </div>
        </div>
    );
};

export default FeedSkeleton;





