// components/Navbar.tsx
'use client';

import React, from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import UserProfile from './UserProfile';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css'; // <-- IMPORTED MODULE

// Lazy load search to optimize initial load
const Search = React.lazy(() => import('./Search'));

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const Navbar = () => {
    const [scrolled, setScrolled] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [loadSearch, setLoadSearch] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => { setScrolled(window.scrollY > 50); };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openSearch = () => {
        setLoadSearch(true);
        setIsSearchOpen(true);
    };

    return (
        <>
            <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <div className={`container ${styles.navContainer}`}>
                    <Link href="/" className={`${styles.navLogo} no-underline`}>∞</Link>
                    <nav>
                        <ul className={styles.navLinks}>
                            <li><Link href="/reviews">المراجعات</Link></li>
                            <li><Link href="/news">الأخبار</Link></li>
                            <li><Link href="/articles">المقالات</Link></li>
                            <li><Link href="/releases">الإصدارات</Link></li>
                            <li><Link href="/celestial-almanac">التقويم</Link></li>
                            <li><Link href="/constellation">الكوكبة</Link></li>
                        </ul>
                    </nav>
                    <div className={styles.navControls}>
                        <ThemeToggle />
                        <UserProfile />
                        <button className={styles.navSearch} onClick={openSearch} aria-label="فتح البحث">
                            <AnimatePresence>
                                {!isSearchOpen && (
                                    <motion.div
                                        key="search-icon"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, rotate: -360, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    >
                                        <SearchIcon />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </header>
            {loadSearch && (
                <React.Suspense fallback={null}>
                    <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                </React.Suspense>
            )}
        </>
    );
};

export default Navbar;


