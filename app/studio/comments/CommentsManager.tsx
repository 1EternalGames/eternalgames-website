// app/studio/comments/CommentsManager.tsx
'use client';

import { useState, useCallback } from 'react';
import { getPaginatedComments, adminDeleteComment } from './actions';
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/lib/toastStore';
import styles from './Comments.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommentsManager({ initialComments }: { initialComments: any[] }) {
    const [comments, setComments] = useState(initialComments);
    const [offset, setOffset] = useState(initialComments.length);
    const [hasMore, setHasMore] = useState(initialComments.length === 100);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Load next 100
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const newComments = await getPaginatedComments(offset, 100);
            if (newComments.length < 100) setHasMore(false);
            setComments(prev => [...prev, ...newComments]);
            setOffset(prev => prev + newComments.length);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading]);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
        const result = await adminDeleteComment(id);
        if (result.success) {
            toast.success('تم حذف التعليق');
            setComments(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true, content: '[تم الحذف بواسطة الإدارة]' } : c));
        } else {
            toast.error('فشل الحذف');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.commentList}>
                <AnimatePresence initial={false}>
                    {comments.map((comment) => (
                        <motion.div 
                            key={comment.id} 
                            className={`${styles.commentCard} ${comment.isDeleted ? styles.deleted : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className={styles.avatarWrapper}>
                                <Image 
                                    src={comment.author.image || '/default-avatar.svg'} 
                                    alt="Avatar" 
                                    width={40} height={40} 
                                    className={styles.avatar} 
                                />
                            </div>
                            <div className={styles.content}>
                                <div className={styles.header}>
                                    <span className={styles.authorName}>{comment.author.name}</span>
                                    <span className={styles.date}>{new Date(comment.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <p className={styles.text}>{comment.content}</p>
                                <div className={styles.actions}>
                                    <Link href={`/${comment.contentSlug}`} className={styles.linkButton} target="_blank">
                                        عرض في الموقع ↗
                                    </Link>
                                    {!comment.isDeleted && (
                                        <button onClick={() => handleDelete(comment.id)} className={styles.deleteButton}>
                                            حذف
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {hasMore && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <InfiniteScrollSentinel onIntersect={loadMore} />
                    {isLoading && <div className="spinner" />}
                </div>
            )}
        </div>
    );
}