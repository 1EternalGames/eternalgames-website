// components/skeletons/CommentListSkeleton.tsx
import React from 'react';
import styles from './CommentSkeleton.module.css';

const CommentSkeletonItem = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.avatar} />
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.name} />
                    <div className={styles.date} />
                </div>
                <div className={styles.body}>
                    <div className={styles.line} style={{ width: '90%' }} />
                    <div className={styles.line} style={{ width: '60%' }} />
                </div>
                <div className={styles.actions}>
                    <div className={styles.action} />
                    <div className={styles.action} />
                </div>
            </div>
        </div>
    );
};

export default function CommentListSkeleton() {
    return (
        <div style={{ marginTop: '2rem', borderRight: '2px solid var(--border-color)' }}>
            {[1, 2, 3].map((i) => (
                <CommentSkeletonItem key={i} />
            ))}
        </div>
    );
}


