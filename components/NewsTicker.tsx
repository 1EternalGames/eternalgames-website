// components/NewsTicker.tsx
'use client';
import Link from "next/link";
import { motion, useInView } from 'framer-motion';
import { useRef } from "react";
import Image from "next/image";
import styles from './NewsTicker.module.css';

const containerVariants = { hidden: { opacity: 0, x: 100 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1, delayChildren: 0.3 } } };
const itemVariants = { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

export default function NewsTicker({ latestNews }: { latestNews: any[] }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    if (!latestNews || latestNews.length === 0) return null;

    return (
        <motion.div ref={ref} className={styles.newsTickerContainer} variants={containerVariants} initial="hidden" animate={isInView ? "visible" : "hidden"}>
            <h3 className={styles.newsTickerTitle}>نبض الأحداث</h3>
            <div className={styles.newsTickerList}>
                {latestNews.map(item => {
                    const imageSource = item.imageUrl;
                    if (!imageSource) return null;

                    // --- THE DEFINITIVE FIX: ---
                    const baseUrl = imageSource.split('?')[0];
                    const imageUrl = `${baseUrl}?w=100&h=100&auto=format&q=75`;

                    return (
                        <motion.div key={item.id} variants={itemVariants}>
                            <Link href={`/news/${item.slug}`} className={`${styles.newsTickerItem} no-underline`}>
                                <div className={styles.newsTickerImageContainer}>
                                    <Image 
                                        src={imageUrl} 
                                        alt={item.title} 
                                        width={50}
                                        height={50}
                                        className={styles.newsTickerImage}
                                        unoptimized
                                    />
                                </div>
                                <div className={styles.newsTickerTextContent}>
                                    <p className={styles.newsTickerCategory}>{item.category}</p>
                                    <p className={styles.newsTickerItemTitle}>{item.title}</p>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
            <Link href="/news" className={styles.newsTickerArchiveLink}>عرض كل الأخبار ←</Link>
        </motion.div>
    );
}