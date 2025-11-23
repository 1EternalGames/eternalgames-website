// components/StudioBar.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioIcon } from '@/components/icons/index';
import styles from './StudioBar.module.css';

const EditIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> </svg> );

export default function StudioBar() {
    // FIX: Use client-side session hook instead of server props
    const { data: session } = useSession();
    const pathname = usePathname();
    
    const userRoles = (session?.user as any)?.roles || [];
    const isCreatorOrAdmin = userRoles.some((role: string) => ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role));
    
    let editPath = null;

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
                    <Link href="/studio" className={`${styles.studioBarButton} ${styles.brand}`} prefetch={false}>
                        <StudioIcon height={20} width={20} />
                        <span>الديوان</span>
                    </Link>

                    {editPath && (
                        <Link href={editPath} className={styles.studioBarButton} prefetch={false}>
                            <EditIcon />
                            <span>تعديل الصفحة</span>
                        </Link>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}