// components/ui/NewsItemSkeleton.tsx
import React from 'react';
import styles from './NewsItemSkeleton.module.css';

export default function NewsItemSkeleton() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.innerGrid}>
                <div className={styles.imageSkeleton} />
                <div className={styles.contentSkeleton}>
                    <div>
                        <div className={`${styles.textLine} ${styles.titleLine}`} />
                        <div className={`${styles.textLine} ${styles.titleLine}`} style={{ width: '60%' }} />
                    </div>
                    <div className={`${styles.textLine} ${styles.metaLine}`} />
                </div>
            </div>
        </div>
    );
}