// components/UserProfile.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/store';
import styles from './UserProfile.module.css';

const SignInModal = lazy(() => import('./SignInModal'));

const UserProfile = () => {
    const { data: session, status } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { setSignInModalOpen } = useUserStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (status === 'loading') {
        return <div className={styles.userAvatarSkeleton} />;
    }

    if (session && session.user) {
        const userInitial = session.user.name ? session.user.name.charAt(0).toUpperCase() : '?';

        return (
            <div className={styles.userProfileContainer} ref={dropdownRef}>
                <motion.button
                    className={styles.userAvatarButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="فتح قائمة المستخدم"
                    animate={{ scale: isDropdownOpen ? 1.1 : 1, rotate: isDropdownOpen ? -15 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                    {session.user.image ? (
                        <Image
                            src={session.user.image}
                            alt={session.user.name || 'User Avatar'}
                            width={36}
                            height={36}
                            className={styles.userAvatar}
                        />
                    ) : (
                        <div className={styles.userAvatarFallback}><span>{userInitial}</span></div>
                    )}
                </motion.button>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            className={styles.userDropdown}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <div className={styles.dropdownUserInfo}>
                                <p className={styles.dropdownUserName}>{session.user.name}</p>
                                <p className={styles.dropdownUserEmail}>{session.user.email}</p>
                            </div>
                            <div className={styles.userDropdownDivider} />
                            
                            {session.user.username && (
                                <Link href={`/profile/${session.user.username}`} className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)}>ملفك الشخصي</Link>
                            )}

                            <Link href="/profile" className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)}>الإعدادات</Link>
                            <Link href="/profile/bookmarks" className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)}>المحفوظات</Link>
                            
                            <div className={styles.userDropdownDivider} />
                            <button onClick={() => signOut()} className={`${styles.userDropdownItem} ${styles.signout}`}>خروج</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <>
            <motion.button
                onClick={() => setSignInModalOpen(true)}
                className={styles.signInButton}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
            >ولوج</motion.button>
            <Suspense fallback={null}>
                <SignInModal />
            </Suspense>
        </>
    );
};

export default UserProfile;