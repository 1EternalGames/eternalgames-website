// components/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import UserProfile from './UserProfile';
import NotificationBell from '@/components/notifications/NotificationBell';
import PerformanceSettings from '@/components/PerformanceSettings';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { useScrolled } from '@/hooks/useScrolled';
import { useBodyClass } from '@/hooks/useBodyClass';
import { useUIStore } from '@/lib/uiStore';
import { ReviewIcon, NewsIcon, ArticleIcon, ReleaseIcon, StudioIcon, PreviewIcon } from '@/components/icons/index';
import { EternalGamesIcon } from '@/components/icons/AuthIcons';
import { useEditorStore } from '@/lib/editorStore';
import { QualityToggle } from '@/app/studio/[contentType]/[id]/editor-components/QualityToggle';
import Search from './Search';
import styles from './Navbar.module.css';
import editorStyles from '@/app/studio/[contentType]/[id]/Editor.module.css';
import { useContentStore } from '@/lib/contentStore'; 

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
    <div style={{ width: '24px', height: '24px', position: 'relative' }}>
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '6px', borderRadius: '2px' }} animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 5 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} />
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '11px', borderRadius: '2px' }} animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.1 }} />
        <motion.span style={{ position: 'absolute', right: 0, height: '2.5px', width: '24px', backgroundColor: 'currentColor', top: '16px', borderRadius: '2px' }} animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -5 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} />
    </div>
);

// ... (Icons ConstellationIcon, CelestialAlmanacIcon remain same) ...
const ConstellationIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24" fill="none" role="img" color="currentColor" {...props} style={{ transform: 'translate(1px, 2px)' }}><path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M20 18C21.1046 18 22 17.1046 22 16C22 14.8954 21.1046 14 20 14C18.8954 14 18 14.8954 18 16C18 17.1046 18.8954 18 20 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M11 22C12.1046 22 13 21.1046 13 20C13 18.8954 12.1046 18 11 18C9.89543 18 9 18.8954 9 20C9 21.1046 9.89543 22 11 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M15 6C16.1046 6 17 5.10457 17 4C17 2.89543 16.1046 2 15 2C13.8954 2 13 2.89543 13 4C13 5.10457 13.8954 6 15 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M4 10C5.10457 10 6 9.10457 6 8C6 6.89543 5.10457 6 4 6C2.89543 6 2 6.89543 2 8C2 9.10457 2.89543 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M14.5 6L12.5 10M13 4.5L6 7.5M12 14L11 18M14 13L18 15M18 17L13 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path></svg>);
const CelestialAlmanacIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24" fill="none" color="currentColor" {...props}><path fillRule="evenodd" clipRule="evenodd" d="M18 1.25C19.5188 1.25 20.75 2.48122 20.75 4V4.23047C20.75 5.5687 20.1855 6.84489 19.1953 7.74512L15.7441 10.8818C15.4292 11.1681 15.25 11.5744 15.25 12C15.25 12.4256 15.4292 12.8319 15.7441 13.1182L19.1953 16.2549C20.1855 17.1551 20.75 18.4313 20.75 19.7695V20C20.75 21.5188 19.5188 22.75 18 22.75H6C4.48122 22.75 3.25 21.5188 3.25 20V19.7695C3.25 18.4313 3.81451 17.1551 4.80469 16.2549L8.25586 13.1182C8.57077 12.8319 8.75 12.4256 8.75 12C8.75 11.5744 8.57077 11.1681 8.25586 10.8818L4.80469 7.74512C3.81451 6.84489 3.25 5.5687 3.25 4.23047V4C3.25 2.48122 4.48122 1.25 6 1.25H18Z" fill="currentColor"/><path d="M16.5 19.5001V17.0001H14C13.4477 17.0001 13 16.5523 13 16.0001C13 15.4478 13.4477 15.0001 14 15.0001H16.5V12.5001C16.5 11.9478 16.9477 11.5001 17.5 11.5001C18.0523 11.5001 18.5 11.9478 18.5 12.5001V15.0001H21C21.5523 15.0001 22 15.4478 22 16.0001C22 16.5523 21.5523 17.0001 21 17.0001H18.5V19.5001C18.5 20.0523 18.0523 20.5001 17.5 20.5001C16.9477 20.5001 16.5 20.0523 16.5 19.5001Z" fill="none" stroke="var(--bg-primary)" strokeWidth="2.5"/><path d="M16.5 19.5001V17.0001H14C13.4477 17.0001 13 16.5523 13 16.0001C13 15.4478 13.4477 15.0001 14 15.0001H16.5V12.5001C16.5 11.9478 16.9477 11.5001 17.5 11.5001C18.0523 11.5001 18.5 11.9478 18.5 12.5001V15.0001H21C21.5523 15.0001 22 15.4478 22 16.0001C22 16.5523 21.5523 17.0001 21 17.0001H18.5V19.5001C18.5 20.0523 18.0523 20.5001 17.5 20.5001C16.9477 20.5001 16.5 20.0523 16.5 19.5001Z" fill="currentColor"/></svg>);

const navItems = [
    { href: '/reviews', label: 'المراجعات', Icon: ReviewIcon, section: 'reviews' },
    { href: '/news', label: 'الأخبار', Icon: NewsIcon, section: 'news' },
    { href: '/articles', label: 'المقالات', Icon: ArticleIcon, section: 'articles' },
    { href: '/releases', label: 'الإصدارات', Icon: ReleaseIcon, section: 'releases' },
    { href: '/celestial-almanac', label: 'التقويم', Icon: CelestialAlmanacIcon },
    { href: '/constellation', label: 'الكوكبة', Icon: ConstellationIcon }
];

// ... (Animation Variants remain same) ...
const orbitalContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } } };
const itemTransition: Transition = { type: 'spring', stiffness: 400, damping: 20 };

const OrbitalNavItem = ({ item, angle, radius, isActive, onClick }: any) => {
    const { openIndexOverlay } = useContentStore();
    
    // INTERCEPT NAVIGATION
    const handleNavClick = (e: React.MouseEvent) => {
        if (item.section) {
            e.preventDefault();
            // This sets the store state to "active section", triggering overlay
            openIndexOverlay(item.section as any);
            onClick();
        } else {
            // Let normal navigation happen for Almanac/Constellation
            onClick();
        }
    };
    
    // ... (Math logic same) ...
    const cosAngle = Math.round(Math.cos(angle) * 1e10) / 1e10;
    const sinAngle = Math.round(Math.sin(angle) * 1e10) / 1e10;
    const x = `calc(${radius} * ${cosAngle})`;
    const y = `calc(${radius} * ${sinAngle})`;

    const itemVariants: Variants = { hidden: { scale: 0, x: 0, y: 0, opacity: 0 }, visible: { scale: 1, x, y, opacity: 1 }, exit: { scale: 0, x: 0, y: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }, };
    
    return (
        <motion.div variants={itemVariants} transition={itemTransition} className={styles.orbitalItemWrapper}>
            <Link href={item.href} onClick={handleNavClick} className="no-underline" prefetch={false}>
                <motion.div className={`${styles.orbitalOrb} ${isActive ? styles.active : ''}`} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                    <item.Icon />
                </motion.div>
            </Link>
            <motion.div className={styles.orbitalTitle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } }} exit={{ opacity: 0, y: 5, transition: { duration: 0.1 } }}>
                {item.label}
            </motion.div>
        </motion.div>
    );
};

// ... (Preview Button logic same) ...
const AnimatedPreviewIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><motion.circle cx="12" cy="12" r="3" variants={{ hover: { scaleY: 0.1, transition: { duration: 0.1, ease: "easeOut" } }, rest: { scaleY: 1, transition: { duration: 0.2, delay: 0.1, ease: "easeIn" } } }} /></svg>);
const EditorPreviewButton = () => {
    const { liveUrl } = useEditorStore();
    const MotionLink = motion(Link);
    const linkVariants = { rest: { color: 'var(--text-primary)', scale: 1 }, hover: { color: 'var(--accent)', scale: 1.15 } };
    return liveUrl ? (<MotionLink href={liveUrl} target="_blank" className={`${editorStyles.iconButton} no-underline`} title="معاينة الصفحة الحية" initial="rest" whileHover="hover" whileTap="hover" animate="rest" variants={linkVariants} transition={{ type: 'spring', stiffness: 400, damping: 15 }} prefetch={false}><AnimatedPreviewIcon /></MotionLink>) : (<motion.button className={editorStyles.iconButton} disabled title="المستند غير منشور"><PreviewIcon /></motion.button>);
};

const BlackHoleNavLink = ({ item, isActive, onClick }: any) => {
    const { openIndexOverlay } = useContentStore();
    const [isHovered, setIsHovered] = useState(false);
    
    // INTERCEPT NAVIGATION
    const handleClick = (e: React.MouseEvent) => {
        if (item.section) {
            e.preventDefault();
            openIndexOverlay(item.section as any);
        }
        if (onClick) onClick();
    };
    
    return (
        <Link 
            href={item.href} 
            onClick={handleClick} 
            prefetch={false} 
            className={styles.blackHoleLink}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={styles.contentContainer}>
                <motion.span
                    className={styles.textWrapper}
                    animate={isHovered ? "sucked" : "rest"}
                    variants={{ rest: { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" } }, sucked: { y: -20, scale: 0.6, opacity: 0, filter: "blur(8px)", transition: { duration: 0.3, ease: "easeIn" } } }}
                    style={{ color: isActive ? "var(--accent)" : "var(--text-primary)", transformOrigin: "center bottom" }}
                >
                    {item.label}
                </motion.span>
                <motion.div
                    className={styles.iconWrapper}
                    initial={{ y: 25, scale: 0.5, rotate: -45, opacity: 0 }}
                    animate={isHovered ? "active" : "inactive"}
                    variants={{ inactive: { y: 25, scale: 0.5, rotate: -45, opacity: 0, transition: { duration: 0.3, ease: "easeOut" } }, active: { y: 0, scale: 1.1, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25, mass: 1, delay: 0.05 } } }}
                >
                     <item.Icon className={styles.navIconSvg} />
                </motion.div>
            </div>
        </Link>
    );
};

const Navbar = () => {
    const scrolled = useScrolled(50);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
    const { isEditorActive, blockUploadQuality, setBlockUploadQuality } = useEditorStore();
    const pathname = usePathname();
    
    // NEW: Also check store state for active section
    const indexSection = useContentStore(s => s.indexSection);
    const { isOverlayOpen, closeOverlay, forceCloseOverlay } = useContentStore(); // FIX: Import forceCloseOverlay

    useBodyClass('mobile-menu-open', isMobileMenuOpen);

    const openSearch = () => { setIsSearchOpen(true); setMobileMenuOpen(false); };
    const closeAll = () => { setMobileMenuOpen(false); setIsSearchOpen(false); }
    
    const handleLogoClick = (e: React.MouseEvent) => {
        closeAll();
        // FIX: Force close ANY overlay state when clicking logo, regardless of current flag
        // This ensures a clean state reset when returning home.
        forceCloseOverlay();
        if (isOverlayOpen) {
            e.preventDefault();
            // closeOverlay will handle the URL replacement if needed
            closeOverlay();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    return (
        <>
            <header 
                className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
                style={isOverlayOpen ? { width: 'calc(100% - 8px)', right: 'auto', left: 0 } : undefined}
            >
                <div className={`container ${styles.navContainer}`}>
                    <div className={styles.desktopView}>
                        <Link href="/" className={`${styles.navLogo} no-underline`} onClick={handleLogoClick} prefetch={false}>
                            <EternalGamesIcon style={{ width: '30px', height: '30px' }} />
                        </Link>
                        <nav>
                            <ul className={styles.navLinks}>
                                {navItems.map(item => {
                                    // Check URL OR Store State
                                    const isActive = pathname.startsWith(item.href) || indexSection === item.section;
                                    return (
                                        <li key={item.href} className={styles.navItem}>
                                            <BlackHoleNavLink 
                                                item={item} 
                                                isActive={isActive} 
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className={styles.navControls}>
                            <PerformanceSettings />
                            {isEditorActive && <EditorPreviewButton />}
                            <NotificationBell />
                            <ThemeToggle />
                            <UserProfile />
                            <button className={styles.navSearch} onClick={openSearch} aria-label="فتح البحث (Ctrl+K)">
                                <SearchIcon />
                            </button>
                        </div>
                    </div>

                    <div className={styles.mobileView}>
                        <div className={styles.mobileNavGroupLeft}>
                            <button className={styles.hamburgerButton} onClick={toggleMobileMenu} aria-label="تبديل القائمة">
                                <HamburgerIcon isOpen={isMobileMenuOpen} />
                            </button>
                            {isEditorActive && (
                                <QualityToggle currentQuality={blockUploadQuality} onQualityChange={setBlockUploadQuality} isMobile={true} />
                            )}
                             <button className={styles.navSearch} onClick={openSearch} aria-label="فتح البحث">
                                <SearchIcon />
                            </button>
                            <PerformanceSettings isMobile={true} />
                        </div>
                        <Link href="/" className={`${styles.navLogo} no-underline`} onClick={handleLogoClick} prefetch={false}>
                            <EternalGamesIcon style={{ width: '28px', height: '28px' }} />
                        </Link>
                        <div className={styles.mobileNavGroupRight}>
                            {isEditorActive && <EditorPreviewButton />}
                            <NotificationBell />
                            <ThemeToggle />
                            <UserProfile />
                        </div>
                    </div>
                </div>
            </header>
            
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div className={styles.mobileNavOverlay} onClick={closeAll} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className={styles.mobileNavContent} variants={orbitalContainerVariants} initial="hidden" animate="visible" exit="exit">
                            <Link href="/" onClick={handleLogoClick} className={`${styles.orbitalCenter} no-underline ${pathname === '/' ? styles.active : ''}`} prefetch={false}>
                                <EternalGamesIcon style={{ width: '48px', height: '48px' }} />
                            </Link>
                            {navItems.map((item, i) => {
                                const angle = -Math.PI / 2 + (i / navItems.length) * (Math.PI * 2);
                                return ( <OrbitalNavItem key={item.href} item={item} angle={angle} radius="min(38vh, 38vw)" isActive={pathname.startsWith(item.href) || indexSection === item.section} onClick={closeAll} /> );
                            })}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Navbar;