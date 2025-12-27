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
    initialCreators = [],
    initialTags = [],
    initialGames = [] // NEW
}: { 
    initialUserState?: InitialUserState,
    initialCreators?: any[],
    initialTags?: any[],
    initialGames?: any[] // NEW
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    const { setNotifications, setUnreadCount } = useNotificationStore();
    const { hydrateCreators, hydrateTags, hydrateContent } = useContentStore(); // Added hydrateContent
    
    const lastSyncedUserId = useRef<string | null>(null);
    const hasHandledOnboarding = useRef(false);
    const hasHydratedStatic = useRef(false);

    // FIX: Hydrate Creators, Tags, and Games immediately
    useEffect(() => {
        if (!hasHydratedStatic.current) {
            let didHydrate = false;
            if (initialCreators && initialCreators.length > 0) {
                hydrateCreators(initialCreators);
                didHydrate = true;
            }
            if (initialTags && initialTags.length > 0) {
                hydrateTags(initialTags);
                didHydrate = true;
            }
            if (initialGames && initialGames.length > 0) {
                hydrateContent(initialGames); // Games are stored in main contentMap
                didHydrate = true;
            }
            
            if (didHydrate) {
                hasHydratedStatic.current = true;
            }
        }
    }, [initialCreators, initialTags, initialGames, hydrateCreators, hydrateTags, hydrateContent]);

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