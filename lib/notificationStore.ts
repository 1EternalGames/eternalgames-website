// lib/notificationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Removed import of getNotifications action

interface NotificationState {
    notifications: any[];
    unreadCount: number;
    isFetching: boolean;
    lastFetched: number;
    fetchNotifications: (force?: boolean) => Promise<void>;
    setUnreadCount: (count: number | ((prev: number) => number)) => void;
    setNotifications: (notifs: any[] | ((prev: any[]) => any[])) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isFetching: false,
            lastFetched: 0,

            fetchNotifications: async (force = false) => {
                const { isFetching, lastFetched, notifications } = get();
                const now = Date.now();
                
                // Cache policy: 15 minutes
                const STALE_TIME = 15 * 60 * 1000; 
                const isFresh = (now - lastFetched < STALE_TIME);
                const hasData = notifications.length > 0;

                if (isFetching) return;
                if (!force && hasData && isFresh) return;

                set({ isFetching: true });
                try {
                    // UPDATED: Fetch from dedicated API route instead of Server Action
                    const res = await fetch('/api/notifications');
                    const result = await res.json();
                    
                    if (result.success) {
                        set({
                            notifications: result.notifications || [],
                            unreadCount: result.unreadCount || 0,
                            lastFetched: Date.now()
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch notifications");
                } finally {
                    set({ isFetching: false });
                }
            },

            setUnreadCount: (updater) => set(state => ({
                unreadCount: typeof updater === 'function' ? updater(state.unreadCount) : updater
            })),
            setNotifications: (updater) => set(state => ({
                notifications: typeof updater === 'function' ? updater(state.notifications) : updater
            }))
        }),
        {
            name: 'eternalgames-notifications-v1', 
            partialize: (state) => ({ 
                notifications: state.notifications, 
                unreadCount: state.unreadCount, 
                lastFetched: state.lastFetched 
            }),
        }
    )
);