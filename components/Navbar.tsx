// components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import UserProfile from './UserProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrolled } from '@/hooks/useScrolled';
import { useBodyClass } from '@/hooks/useBodyClass';
import styles from './Navbar.module.css';

const Search = React.lazy(() => import('./Search'));

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
    <div style={{ width: '24px', height: '24px', position: 'relative' }}>
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '6px' }} animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 5 : 0 }} />
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '11px' }} animate={{ opacity: isOpen ? 0 : 1 }} />
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '16px' }} animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -5 : 0 }} />
    </div>
);

const Navbar = () => {
    const scrolled = useScrolled(50);
    const pathname = usePathname();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [loadSearch, setLoadSearch] = useState(false);

    useBodyClass('editor-active', isMenuOpen);

    const openSearch = () => {
        setLoadSearch(true);
        setIsSearchOpen(true);
        setIsMenuOpen(false);
    };

    const closeAll = () => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
    }
    
    const isHomepage = pathname === '/';

    const navItems = [
        { href: '/reviews', label: 'المراجعات' },
        { href: '/news', label: 'الأخبار' },
        { href: '/articles', label: 'المقالات' },
        { href: '/releases', label: 'الإصدارات' },
        { href: '/celestial-almanac', label: 'التقويم' },
        { href: '/constellation', label: 'الكوكبة' }
    ];

    return (
        <>
            <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <div className={`container ${styles.navContainer}`}>
                    <Link href="/" className={`${styles.navLogo} no-underline`} onClick={closeAll}>∞</Link>
                    <nav>
                        <ul className={`${styles.navLinks} ${isHomepage ? styles.mobileHomepage : ''}`}>
                            {navItems.map(item => (
                                <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
                            ))}
                        </ul>
                    </nav>
                    <div className={styles.navControls}>
                        <ThemeToggle />
                        <UserProfile />
                        <button className={styles.navSearch} onClick={openSearch} aria-label="فتح البحث">
                            <SearchIcon />
                        </button>
                        <button className={`${styles.hamburgerButton} ${isHomepage ? styles.hideOnHomepage : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                            <HamburgerIcon isOpen={isMenuOpen} />
                        </button>
                    </div>
                </div>
            </header>
            
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className={styles.mobileNavOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={styles.mobileNavContent}
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { delay: 0.1, staggerChildren: 0.05 } }}
                            exit={{ y: -50, opacity: 0 }}
                        >
                            <ul className={styles.mobileNavLinks}>
                                {navItems.map(item => (
                                    <motion.li key={item.href} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                                        <Link href={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loadSearch && (
                <React.Suspense fallback={null}>
                    <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                </React.Suspense>
            )}
        </>
    );
};

export default Navbar;