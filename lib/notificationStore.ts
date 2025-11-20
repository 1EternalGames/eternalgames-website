// lib/notificationStore.ts
import { create } from 'zustand';
import { getNotifications } from '@/app/actions/notificationActions';

interface NotificationState {
    notifications: any[];
    unreadCount: number;
    isFetching: boolean;
    lastFetched: number;
    fetchNotifications: () => Promise<void>;
    setUnreadCount: (count: number | ((prev: number) => number)) => void;
    setNotifications: (notifs: any[] | ((prev: any[]) => any[])) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isFetching: false,
    lastFetched: 0,

    fetchNotifications: async () => {
        const now = Date.now();
        // LOCK: If already fetching OR fetched less than 5 seconds ago, do nothing.
        // This effectively kills the duplicate requests from Desktop/Mobile double-render.
        if (get().isFetching || (now - get().lastFetched < 5000)) {
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

    // Helper setters to allow optimistic updates from UI components
    setUnreadCount: (updater) => set(state => ({
        unreadCount: typeof updater === 'function' ? updater(state.unreadCount) : updater
    })),
    setNotifications: (updater) => set(state => ({
        notifications: typeof updater === 'function' ? updater(state.notifications) : updater
    }))
}));