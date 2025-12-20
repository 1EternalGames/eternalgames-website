// components/skeletons/HeroSkeleton.tsx
import React from 'react';
import styles from './HeroSkeleton.module.css';

export default function HeroSkeleton({ variant = 'center' }: { variant?: 'center' | 'news' }) {
    return (
        <div className={`${styles.heroSkeleton} ${variant === 'news' ? styles.news : ''}`}>
            <div className={styles.heroContent}>
                <div className={`${styles.line} ${styles.category}`}></div>
                <div className={`${styles.line} ${styles.title}`}></div>
                <div className={`${styles.line} ${styles.meta}`}></div>
                <div className={`${styles.line} ${styles.button}`}></div>
            </div>
        </div>
    );
}


