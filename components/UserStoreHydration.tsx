// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/notificationStore';
import { useRouter, usePathname } from 'next/navigation';

type InitialUserState = {
    likes: string[];
    bookmarks: string[];
    shares: string[];
} | null;

export default function UserStoreHydration({ initialUserState }: { initialUserState?: InitialUserState }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    const { setNotifications, setUnreadCount } = useNotificationStore();
    
    const lastSyncedUserId = useRef<string | null>(null);
    const hasHandledOnboarding = useRef(false);

    // Safe access to user ID for logic comparison
    const currentUserId = (session?.user as any)?.id;

    useEffect(() => {
        // 1. Handle Onboarding Redirect
        if (status === 'authenticated' && (session as any)?.needsOnboarding && !hasHandledOnboarding.current) {
            if (pathname !== '/welcome') {
                hasHandledOnboarding.current = true;
                const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
                router.push(`/welcome${callbackUrl}`);
            }
            return; 
        }

        if (status === 'loading') return;

        // 2. Handle Data Hydration
        if (status === 'authenticated') {
            // Check if we have synced for THIS user ID specifically
            const needsSync = !isSyncedWithDb || (currentUserId && lastSyncedUserId.current !== currentUserId);

            if (needsSync && currentUserId) {
                fetch('/api/user/init')
                    .then(res => res.json())
                    .then(result => {
                        if (result.success) {
                            if (result.userState) {
                                syncWithDb(result.userState);
                                setIsSyncedWithDb(true);
                            }
                            
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
            if (_hasHydrated && lastSyncedUserId.current !== null) {
                reset();
                setNotifications([]);
                setUnreadCount(0);
                lastSyncedUserId.current = null;
                setIsSyncedWithDb(false); 
            }
        }

    // FIX: Removed 'session?.user?.id' to prevent TS error. 
    // Using 'currentUserId' (defined in body) or just 'session' covers the reactivity needs.
    }, [status, session, currentUserId, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb, setNotifications, setUnreadCount, initialUserState, pathname]);

    return null;
}