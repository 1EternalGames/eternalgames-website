// components/skeletons/CardSkeleton.tsx
import styles from './CardSkeleton.module.css';

export default function CardSkeleton() {
    return (
        <div className={styles.cardSkeleton}>
            <div className={styles.imageSkeleton}></div>
            <div className={styles.contentSkeleton}>
                <div className={`${styles.line} ${styles.title}`}></div>
                <div className={`${styles.line} ${styles.meta}`}></div>
                <div className={`${styles.line} ${styles.metaShort}`}></div>
                <div className={styles.tagArea}>
                    <div className={styles.tag}></div>
                    <div className={styles.tag}></div>
                </div>
            </div>
        </div>
    );
}