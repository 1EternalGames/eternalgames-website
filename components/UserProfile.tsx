// components/UserProfile.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/store';
import { UserCircleIcon, UserSettings01Icon, AllBookmarkIcon, Logout03Icon } from '@/components/icons/index';
import SignInModal from './SignInModal';
import styles from './UserProfile.module.css';

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
                            
                            {(session.user as any).username && (
                                <Link href={`/profile/${(session.user as any).username}`} className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)} prefetch={false}>
                                    <UserCircleIcon className={styles.dropdownItemIcon} />
                                    <span>ملفك الشخصي</span>
                                </Link>
                            )}

                            <Link href="/profile" className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)} prefetch={false}>
                                <UserSettings01Icon className={styles.dropdownItemIcon} />
                                <span>الإعدادات</span>
                            </Link>
                            <Link href="/profile/bookmarks" className={`${styles.userDropdownItem} no-underline`} onClick={() => setIsDropdownOpen(false)} prefetch={false}>
                                <AllBookmarkIcon className={styles.dropdownItemIcon} />
                                <span>المحفوظات</span>
                            </Link>
                            
                            <div className={styles.userDropdownDivider} />
                            <button onClick={() => signOut()} className={`${styles.userDropdownItem} ${styles.signout}`}>
                                <Logout03Icon className={styles.dropdownItemIcon} />
                                <span>تسجيل الخروج</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setSignInModalOpen(true)}
                className={styles.signInButton}
            >
                تسجيل الدخول
            </button>
            <SignInModal />
        </>
    );
};

export default UserProfile;


