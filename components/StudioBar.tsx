// components/StudioBar.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioIcon } from '@/components/icons/index';
import { useEffect } from 'react';
import styles from './StudioBar.module.css';

const EditIcon = () => ( <svg width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> </svg> );

export default function StudioBar({ serverRoles = [] }: { serverRoles?: string[] }) {
    const { data: session, update } = useSession();
    const pathname = usePathname();
    
    // Prioritize server roles for immediate rendering feedback
    const effectiveRoles = serverRoles.length > 0 ? serverRoles : (session?.user as any)?.roles || [];
    
    const isCreatorOrAdmin = effectiveRoles.some((role: string) => ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role));
    
    // THE DEFINITIVE FIX:
    // 1. Only attempt to sync if the server actually provided roles (length > 0).
    //    If serverRoles is empty, it means RootLayout didn't find a user, so we shouldn't force a sync loop.
    // 2. Use safe sorting for comparison to avoid false positives.
    useEffect(() => {
        if (serverRoles.length > 0 && session?.user) {
            const sessionRoles = (session.user as any).roles || [];
            
            // Create copies before sorting to avoid mutating props/state
            const sortedServerRoles = [...serverRoles].sort();
            const sortedSessionRoles = [...sessionRoles].sort();

            if (JSON.stringify(sortedServerRoles) !== JSON.stringify(sortedSessionRoles)) {
                console.log("StudioBar: Detected role change from server. Syncing session...");
                update();
            }
        }
    }, [serverRoles, session, update]);

    let editPath = null;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Logic to determine edit path could go here in the future

    if (!isCreatorOrAdmin || pathname.startsWith('/studio')) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className={styles.studioBar}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            >
                <div className={styles.studioBarContent}>
                    <Link href="/studio" className={`${styles.studioBarButton} ${styles.brand}`}>
                        <StudioIcon height={20} width={20} />
                        <span>الديوان</span>
                    </Link>

                    {editPath && (
                        <Link href={editPath} className={styles.studioBarButton}>
                            <EditIcon />
                            <span>تعديل الصفحة</span>
                        </Link>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}