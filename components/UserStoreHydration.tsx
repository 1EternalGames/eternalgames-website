// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

// UPDATED: Type reflects the new optimized structure
type InitialUserState = {
    likes: string[];
    bookmarks: string[];
    shares: string[];
} | null;

function UserStoreHydration({ initialUserState }: { initialUserState?: InitialUserState }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    
    const lastSyncedUserId = useRef<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && (session as any)?.needsOnboarding && pathname !== '/welcome') {
            const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
            router.push(`/welcome${callbackUrl}`);
            return; 
        }

        if (status === 'loading') {
            return;
        }

        if (status === 'authenticated') {
            const currentUserId = (session?.user as any)?.id;
            
            // Use initial server data immediately if available
            if (initialUserState && (!isSyncedWithDb || lastSyncedUserId.current !== currentUserId)) {
                syncWithDb(initialUserState);
                setIsSyncedWithDb(true);
                lastSyncedUserId.current = currentUserId;
                return; 
            }

            const needsSync = !isSyncedWithDb || (currentUserId && lastSyncedUserId.current !== currentUserId);

            if (needsSync && currentUserId) {
                fetch('/api/user/state')
                    .then(res => res.json())
                    .then(result => {
                        if (result.success && result.data) {
                            // data now matches { likes: string[], bookmarks: string[], ... }
                            syncWithDb(result.data);
                            setIsSyncedWithDb(true);
                            lastSyncedUserId.current = currentUserId;
                        }
                    })
                    .catch(err => console.error("Failed to hydrate user state:", err));
            }
        } 
        else if (status === 'unauthenticated') {
            if (_hasHydrated) {
                reset();
                lastSyncedUserId.current = null;
            }
        }

    }, [status, session, pathname, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb, initialUserState]);

    return null;
}

export default UserStoreHydration;