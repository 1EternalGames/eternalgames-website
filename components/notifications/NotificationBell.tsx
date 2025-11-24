// components/notifications/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationIcon } from '@/components/icons/index';
import { useSession } from 'next-auth/react';
import NotificationPanel from './NotificationPanel';
import { useNotificationStore } from '@/lib/notificationStore';
import styles from './Notifications.module.css';

const bellVariants = {
    rest: { rotate: 0, scale: 1 },
    hover: { 
        rotate: [0, -10, 10, -5, 5, 0],
        scale: 1.1,
        transition: { 
            duration: 0.5, 
            ease: "easeInOut" as const
        }
    },
    tap: { scale: 0.95, rotate: 0 }
};

export default function NotificationBell() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const { 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        setUnreadCount, 
        setNotifications 
    } = useNotificationStore();

    // REMOVED: The useEffect that automatically fetched on mount.
    // Data is now pre-loaded by UserStoreHydration via /api/user/init.

    // Manual refresh when opening the panel
    const handleToggle = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        
        if (nextState) {
            // Force a fresh fetch only when explicitly interacting
            fetchNotifications(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!session?.user) return null;

    return (
        <div className={styles.notificationWrapper} ref={panelRef}>
            <motion.button
                className={styles.bellButton}
                onClick={handleToggle}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                variants={bellVariants}
                style={{ transformOrigin: 'top center' }}
                title="الإشعارات"
            >
                <NotificationIcon className={styles.bellIcon} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className={styles.notificationBadge}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <NotificationPanel 
                        notifications={notifications} 
                        onClose={() => setIsOpen(false)}
                        setUnreadCount={setUnreadCount}
                        setNotifications={setNotifications}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}