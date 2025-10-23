// components/StudioBar.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './StudioBar.module.css'; // <-- IMPORTED

const StudioIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2l-5.5 9h11zM12 21.8l-5.5-9h11z"/> </svg> );
const EditIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> </svg> );

export default function StudioBar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    
    const userRoles = session?.user?.roles || [];
    const isCreatorOrAdmin = userRoles.some(role => ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role));
    let editPath = null;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (['reviews', 'articles', 'news'].includes(pathSegments[0]) && pathSegments.length === 2) {
        // Future feature placeholder
    }

    if (!isCreatorOrAdmin || pathname.startsWith('/studio')) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className={styles.studioBar}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className={styles.studioBarContent}>
                    <Link href="/studio" className={`${styles.studioBarButton} ${styles.brand}`}>
                        <StudioIcon />
                        <span>الديوان</span>
                    </Link>

                    {editPath && (
                        <Link href={editPath} className={styles.studioBarButton}>
                            <EditIcon />
                            <span>Edit Page</span>
                        </Link>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}





