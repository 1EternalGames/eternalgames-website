// components/UserStoreHydration.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import { getUserState } from '@/app/actions/userActions';
import { useRouter, usePathname } from 'next/navigation'; // <-- Import useRouter and usePathname

function UserStoreHydration() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const { syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb } = useUserStore();

    useEffect(() => {
        // THE DEFINITIVE FIX (Part 2):
        // This component, which runs on every page, now checks for the onboarding flag.
        // If the flag is present and the user isn't already on the welcome page,
        // it performs a client-side redirect, preserving the session.
        if (status === 'authenticated' && (session as any)?.needsOnboarding && pathname !== '/welcome') {
            const callbackUrl = pathname !== '/' ? `?callbackUrl=${encodeURIComponent(pathname)}` : '';
            router.push(`/welcome${callbackUrl}`);
            return; // Stop further execution in this effect
        }

        if (status === 'loading') {
            if (_hasHydrated) {
                reset();
            }
            return;
        }

        if (status === 'authenticated') {
            if (!isSyncedWithDb) {
                getUserState().then(result => {
                    if (result.success && result.data) {
                        syncWithDb(result.data);
                        setIsSyncedWithDb(true);
                    }
                });
            }
        } 
        else if (status === 'unauthenticated') {
            reset();
        }

    }, [status, session, pathname, router, syncWithDb, reset, _hasHydrated, isSyncedWithDb, setIsSyncedWithDb]);

    return null;
}

export default UserStoreHydration;





