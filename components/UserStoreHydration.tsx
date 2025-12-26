// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/notificationStore';
import { useContentStore } from '@/lib/contentStore'; 
import { useRouter, usePathname } from 'next/navigation';

type InitialUserState = {
    likes: string[];
    bookmarks: string[];
    shares: string[];
} | null;

export default function UserStoreHydration({ 
    initialUserState,
    initialCreators = [] 
}: { 
    initialUserState?: InitialUserState,
    initialCreators?: any[]
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    const { setNotifications, setUnreadCount } = useNotificationStore();
    const { hydrateCreators } = useContentStore(); 
    
    const lastSyncedUserId = useRef<string | null>(null);
    const hasHandledOnboarding = useRef(false);
    const hasHydratedCreators = useRef(false);

    // 1. Hydrate Creators Immediately (Synchronously if possible in effect)
    if (!hasHydratedCreators.current && initialCreators.length > 0) {
        hydrateCreators(initialCreators);
        hasHydratedCreators.current = true;
    }

    const currentUserId = (session?.user as any)?.id;

    useEffect(() => {
        // 2. Handle Onboarding Redirect
        if (status === 'authenticated' && (session as any)?.needsOnboarding && !hasHandledOnboarding.current) {
            if (pathname !== '/welcome') {
                hasHandledOnboarding.current = true;
                const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
                router.push(`/welcome${callbackUrl}`);
            }
            return; 
        }

        if (status === 'loading') return;

        // 3. Handle User Data Hydration
        if (status === 'authenticated') {
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
    }, [status, session, currentUserId, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb, setNotifications, setUnreadCount, initialUserState, pathname]);

    return null;
}