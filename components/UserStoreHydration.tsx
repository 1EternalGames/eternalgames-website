// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { getUserState } from '@/app/actions/userActions';
import { useRouter, usePathname } from 'next/navigation';

// Define the type for the passed state
type InitialUserState = {
    engagements: { contentId: number; contentType: string; type: 'LIKE' | 'BOOKMARK' }[];
    shares: { contentId: number; contentType: string }[];
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
            
            // THE FIX: If we have initial server data, use it immediately
            if (initialUserState && (!isSyncedWithDb || lastSyncedUserId.current !== currentUserId)) {
                syncWithDb(initialUserState);
                setIsSyncedWithDb(true);
                lastSyncedUserId.current = currentUserId;
                return; // Skip the fetch logic below
            }

            const needsSync = !isSyncedWithDb || (currentUserId && lastSyncedUserId.current !== currentUserId);

            if (needsSync && currentUserId) {
                getUserState().then(result => {
                    if (result.success && result.data) {
                        syncWithDb(result.data);
                        setIsSyncedWithDb(true);
                        lastSyncedUserId.current = currentUserId;
                    }
                });
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