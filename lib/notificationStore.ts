// lib/notificationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getNotifications } from '@/app/actions/notificationActions';

interface NotificationState {
    notifications: any[];
    unreadCount: number;
    isFetching: boolean;
    lastFetched: number;
    // Fetch now accepts a 'force' flag
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
                
                // DATA FRESHNESS POLICY:
                // If we have data and it was fetched less than 15 minutes ago,
                // we consider it "fresh" and DO NOT fetch again on page load/refresh.
                const STALE_TIME = 15 * 60 * 1000; 
                const isFresh = (now - lastFetched < STALE_TIME);
                const hasData = notifications.length > 0;

                // If a fetch is already in progress, abort.
                if (isFetching) return;

                // If NOT forced (e.g., page load), AND we have fresh data, abort.
                if (!force && hasData && isFresh) {
                    return;
                }

                set({ isFetching: true });
                try {
                    const result = await getNotifications();
                    if (result.success) {
                        set({
                            notifications: result.notifications || [],
                            unreadCount: result.unreadCount || 0,
                            lastFetched: Date.now()
                        });
                    }
                } catch (error) {
                    console.error("Store failed to fetch notifications:", error);
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
            name: 'eternalgames-notifications-v1', // LocalStorage key
            // Only persist data, not the loading state
            partialize: (state) => ({ 
                notifications: state.notifications, 
                unreadCount: state.unreadCount, 
                lastFetched: state.lastFetched 
            }),
        }
    )
);