// components/notifications/NotificationPanel.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import TimeStamp from '@/components/comments/TimeStamp';
import styles from './Notifications.module.css';
import { useTransition } from 'react';

const panelVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' },
    // THE FIX: Added 'as const' to the transition type to satisfy TypeScript/Framer Motion types
    visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
    exit: { opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

export default function NotificationPanel({ notifications, onClose, setUnreadCount, setNotifications }: any) {
    const [isPending, startTransition] = useTransition();

    const handleMarkRead = (id: string) => {
        // Optimistic update
        setNotifications((prev: any[]) => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
        
        startTransition(async () => {
            await markNotificationAsRead(id);
        });
        onClose();
    };

    const handleMarkAllRead = () => {
        setNotifications((prev: any[]) => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        startTransition(async () => {
            await markAllNotificationsAsRead();
        });
    };

    return (
        <motion.div
            className={styles.notificationPanel}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <div className={styles.panelHeader}>
                <h3>الإشعارات</h3>
                {notifications.length > 0 && (
                    <button onClick={handleMarkAllRead} className={styles.markAllReadButton} disabled={isPending}>
                        تحديد الكل كمقروء
                    </button>
                )}
            </div>

            <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>لا توجد إشعارات جديدة.</p>
                    </div>
                ) : (
                    notifications.map((notification: any) => (
                        <motion.div
                            key={notification.id}
                            className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                            variants={itemVariants}
                            layout
                        >
                            <div className={styles.avatarWrapper}>
                                <Image 
                                    src={notification.sender.image || '/default-avatar.svg'} 
                                    alt={notification.sender.name} 
                                    width={40} height={40} 
                                    className={styles.notificationAvatar} 
                                />
                            </div>
                            <div className={styles.notificationContent}>
                                {/* MODIFIED: Use the explicit `link` field from DB */}
                                <Link 
                                    href={notification.link || '#'}
                                    onClick={() => handleMarkRead(notification.id)}
                                    className={styles.notificationLink}
                                >
                                    <p>
                                        <span className={styles.senderName}>{notification.sender.name}</span>
                                        {' '}رد على تعليقك.
                                    </p>
                                </Link>
                                <div className={styles.notificationMeta}>
                                    <TimeStamp date={notification.createdAt} />
                                </div>
                            </div>
                            {!notification.read && <div className={styles.unreadDot} />}
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}