// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/notificationStore'; // Import Notification Store
import { useRouter, usePathname } from 'next/navigation';

// Updated Type Definition
type InitialUserState = {
    likes: string[];
    bookmarks: string[];
    shares: string[];
} | null;

export default function UserStoreHydration({ initialUserState }: { initialUserState?: InitialUserState }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    
    // Stores
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    const { setNotifications, setUnreadCount } = useNotificationStore();
    
    const lastSyncedUserId = useRef<string | null>(null);

    useEffect(() => {
        // 1. Handle Onboarding Redirect
        if (status === 'authenticated' && (session as any)?.needsOnboarding && pathname !== '/welcome') {
            const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
            router.push(`/welcome${callbackUrl}`);
            return; 
        }

        if (status === 'loading') return;

        // 2. Handle Data Hydration (Batch Fetch)
        if (status === 'authenticated') {
            const currentUserId = (session?.user as any)?.id;
            
            // Prevent duplicate fetching if already synced for this user
            const needsSync = !isSyncedWithDb || (currentUserId && lastSyncedUserId.current !== currentUserId);

            if (needsSync && currentUserId) {
                fetch('/api/user/init')
                    .then(res => res.json())
                    .then(result => {
                        if (result.success) {
                            // A. Hydrate User State (Likes/Bookmarks)
                            if (result.userState) {
                                syncWithDb(result.userState);
                                setIsSyncedWithDb(true);
                            }
                            
                            // B. Hydrate Notifications
                            if (result.notifications) {
                                setNotifications(result.notifications.items || []);
                                setUnreadCount(result.notifications.unreadCount || 0);
                            }

                            lastSyncedUserId.current = currentUserId;
                        }
                    })
                    .catch(err => console.error("Failed to hydrate user data:", err));
            }
        } 
        else if (status === 'unauthenticated') {
            if (_hasHydrated) {
                reset();
                // Also reset notifications? Typically yes, but store doesn't have a reset. 
                // We can manually clear.
                setNotifications([]);
                setUnreadCount(0);
                lastSyncedUserId.current = null;
            }
        }

    }, [status, session, pathname, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb, setNotifications, setUnreadCount, initialUserState]);

    return null;
}