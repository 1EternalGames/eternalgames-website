// components/UserStoreHydration.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { getUserState } from '@/app/actions/userActions';
import { useRouter, usePathname } from 'next/navigation';

function UserStoreHydration() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();
    
    // Track the last synced user ID to prevent re-fetching for the same user
    const lastSyncedUserId = useRef<string | null>(null);

    useEffect(() => {
        // Client-side redirect for onboarding
        if (status === 'authenticated' && (session as any)?.needsOnboarding && pathname !== '/welcome') {
            const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
            router.push(`/welcome${callbackUrl}`);
            return; 
        }

        // THE DEFINITIVE FIX: 
        // 1. Do NOT reset on 'loading'.
        // 2. Only fetch if we are authenticated AND (not synced OR user changed).
        
        if (status === 'loading') {
            return;
        }

        if (status === 'authenticated') {
            const currentUserId = (session?.user as any)?.id;
            
            // Check if we need to sync:
            // - Global store says not synced OR
            // - We are syncing for a different user ID than before (account switch)
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
            // Only reset if explicitly unauthenticated and we were previously hydrated
            if (_hasHydrated) {
                reset();
                lastSyncedUserId.current = null;
            }
        }

    }, [status, session, pathname, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb]);

    return null;
}

export default UserStoreHydration;