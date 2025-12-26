// components/ui/ArticleCardSkeleton.tsx
import React from 'react';
import styles from './ArticleCardSkeleton.module.css';

interface SkeletonProps {
    variant?: 'default' | 'no-score';
}

export default function ArticleCardSkeleton({ variant = 'default' }: SkeletonProps) {
    return (
        <div className={styles.skeletonCard}>
            {/* Background Image Placeholder */}
            <div className={styles.imageSkeleton} />
            
            {/* Gradient Overlay */}
            <div className={styles.overlaySkeleton} />

            {/* Score Badge (Top Left) - Only if default */}
            {variant === 'default' && <div className={styles.scoreBadge} />}

            {/* Title Lines (Bottom Left) */}
            <div className={styles.titleArea}>
                <div className={styles.titleLine} style={{ width: '70%' }} />
                <div className={styles.titleLine} style={{ width: '40%' }} />
            </div>

            {/* Creator Capsule (Bottom Left) */}
            <div className={styles.creatorCapsule} />
            
            {/* Date/Meta (Bottom Right) */}
            <div className={styles.metaArea} />
        </div>
    );
}