// components/releases/ReleasesControlBar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePopoverManager } from '@/hooks/usePopoverManager';
import FilterContainer from '@/components/filters/ui/FilterContainer';
import FilterGroup from '@/components/filters/ui/FilterGroup';
import PopoverTriggerButton from '@/components/filters/ui/PopoverTriggerButton';
import FilterToggleButton from '@/components/filters/ui/FilterToggleButton';
import YearFilterPopover from './YearFilterPopover';
import MonthFilterPopover from './MonthFilterPopover';
import { PlatformIcons } from '@/components/TimelineCard'; 
import styles from '@/components/filters/Filters.module.css'; // Standard Site Styles
import releaseStyles from './ReleasesControlBar.module.css'; // Layout specific overrides

// --- ICONS ---
const ArrowDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
);

const AddToListStrokeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 9V20C3.5 21.1046 4.39543 22 5.5 22H18.5C19.6046 22 20.5 21.1046 20.5 20V4C20.5 2.89543 19.6046 2 18.5 2H12"></path>
        <path d="M13.5 17H17.5"></path>
        <path d="M13.5 7H17.5"></path>
        <path d="M13.5 12H17.5"></path>
        <path d="M6.5 16.5L8 18L11 14"></path>
        <path d="M10 5H3.5M10 5L7.08333 2M10 5L7.08333 8"></path>
    </svg>
);

const AddToListSolidIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M8.05033 1.55292C7.66534 1.15694 7.03224 1.14802 6.63626 1.53301C6.24027 1.91799 6.23135 2.55109 6.61634 2.94708L7.88307 4.25H3.75C3.19772 4.25 2.75 4.69772 2.75 5.25C2.75 5.80229 3.19772 6.25 3.75 6.25H7.88307L6.61634 7.55292C6.23135 7.94891 6.24027 8.58201 6.63625 8.967C7.03224 9.35198 7.66534 9.34306 8.05033 8.94708L10.967 5.94708C11.3443 5.55896 11.3443 4.94104 10.967 4.55292L8.05033 1.55292ZM2.75 20V7.5H5.21144C4.92844 8.30226 5.11492 9.23131 5.76491 9.86324C6.65587 10.7295 8.08035 10.7094 8.94657 9.81843L11.8632 6.81843C12.7123 5.94516 12.7123 4.55485 11.8632 3.68158L9.49921 1.25H18.5C20.0188 1.25 21.25 2.48122 21.25 4V20C21.25 21.5188 20.0188 22.75 18.5 22.75H5.5C3.98122 22.75 2.75 21.5188 2.75 20ZM13.5 16.25C13.0858 16.25 12.75 16.5858 12.75 17C12.75 17.4142 13.0858 17.75 13.5 17.75H17.5C17.9142 17.75 18.25 17.4142 18.25 17C18.25 16.5858 17.9142 16.25 17.5 16.25H13.5ZM12.75 7C12.75 6.58579 13.0858 6.25 13.5 6.25H17.5C17.9142 6.25 18.25 6.58579 18.25 7C18.25 7.41421 17.9142 7.75 17.5 7.75H13.5C13.0858 7.75 12.75 7.41421 12.75 7ZM13.5 11.25C13.0858 11.25 12.75 11.5858 12.75 12C12.75 12.4142 13.0858 12.75 13.5 12.75H17.5C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25H13.5ZM11.45 13.4C11.7814 13.6486 11.8485 14.1187 11.6 14.45L8.6 18.45C8.46955 18.624 8.27004 18.7327 8.05317 18.7482C7.8363 18.7636 7.62341 18.6841 7.46967 18.5304L5.96967 17.0304C5.67678 16.7375 5.67678 16.2626 5.96967 15.9697C6.26256 15.6768 6.73744 15.6768 7.03033 15.9697L7.91885 16.8582L10.4 13.55C10.6485 13.2187 11.1186 13.1515 11.45 13.4Z" fill="currentColor"></path>
    </svg>
);

const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch'];

interface ReleasesControlBarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    showWishlistOnly: boolean;
    onToggleWishlist: () => void;
    onJumpToNow: () => void;
    isAuthenticated: boolean;
    selectedYear: number | 'TBA';
    onYearChange: (year: number | 'TBA') => void;
    selectedMonth: number | 'all';
    onMonthChange: (month: number | 'all') => void;
    selectedPlatform: string | 'all';
    onPlatformChange: (platform: string | 'all') => void;
    availableYears: number[];
}

export default function ReleasesControlBar({ 
    searchTerm, onSearchChange, 
    showWishlistOnly, onToggleWishlist, onJumpToNow, isAuthenticated,
    selectedYear, onYearChange,
    selectedMonth, onMonthChange,
    selectedPlatform, onPlatformChange,
    availableYears
}: ReleasesControlBarProps) {
    
    const { popoverRef, openPopover, togglePopover, closePopover } = usePopoverManager();
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const monthStripRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Auto-scroll the month strip to active month on Desktop
    useEffect(() => {
        if (!isMobile && selectedMonth !== 'all' && typeof selectedMonth === 'number' && monthStripRef.current) {
            const button = monthStripRef.current.children[selectedMonth + 1] as HTMLElement; // +1 for "All" button
            if (button) {
                button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [selectedMonth, isMobile]);

    const handleJump = () => {
        onJumpToNow();
        const now = new Date();
        const monthIdx = now.getMonth();
        const el = document.getElementById(`month-header-${monthIdx}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const offset = 180; 
            const targetY = rect.top + scrollTop - offset;
            
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        }
    };

    const hasActiveFilters = !!(selectedMonth !== 'all' || selectedPlatform !== 'all' || searchTerm || showWishlistOnly);

    // --- Desktop Layout ---
    const desktopFilters = (
        <div className={styles.desktopFilters}>
            
            {/* ROW 1: Search + Year */}
            <div className={releaseStyles.searchYearRow}>
                <div className={releaseStyles.searchInputWrapper}>
                    <input 
                        type="search" 
                        placeholder="ابحث عن لعبة..." 
                        className={styles.searchInput} 
                        value={searchTerm} 
                        onChange={(e) => onSearchChange(e.target.value)} 
                        style={{ width: '100%', margin: 0 }}
                    />
                </div>
                <div className={releaseStyles.yearInputWrapper} style={{ position: 'relative' }}>
                    <PopoverTriggerButton 
                        label={`${selectedYear}`} 
                        isActive={true} 
                        onClick={() => togglePopover('year')} 
                        layoutId="year-highlight"
                        className={styles.filterButton}
                    />
                    <AnimatePresence>
                        {openPopover === 'year' && (
                            <>
                                <div className={styles.popoverBackdrop} onClick={closePopover}></div>
                                <YearFilterPopover 
                                    availableYears={availableYears} 
                                    selectedYear={selectedYear} 
                                    onSelect={(y) => { onYearChange(y); closePopover(); }} 
                                    onClose={closePopover} 
                                />
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ROW 2: Platform + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FilterGroup label="المنصة:">
                    <motion.button 
                        onClick={() => onPlatformChange('all')}
                        className={`${styles.filterButton} ${selectedPlatform === 'all' ? styles.active : ''}`}
                    >
                        الكل
                        {selectedPlatform === 'all' && <motion.div layoutId="plat-highlight" className={styles.filterHighlight} />}
                    </motion.button>
                    
                    {PLATFORMS.map(p => {
                        const isActive = selectedPlatform === p;
                        const Icon = PlatformIcons[p];
                        return (
                            <motion.button 
                                key={p} 
                                onClick={() => onPlatformChange(p)} 
                                className={`${styles.filterButton} ${isActive ? styles.active : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isActive && <motion.div layoutId="plat-highlight" className={styles.filterHighlight} />}
                                <span>{p === 'PlayStation' ? 'PS5' : p}</span>
                                <Icon width={16} height={16} />
                            </motion.button>
                        );
                    })}
                </FilterGroup>

                <FilterGroup>
                    <motion.button 
                        onClick={handleJump} 
                        className={styles.filterButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span>الإنتقال لهذا الشهر</span>
                        <div style={{ transform: 'translateY(2px)' }}>
                            <ArrowDownIcon />
                        </div>
                    </motion.button>

                    <motion.button 
                        onClick={onToggleWishlist}
                        className={`${styles.filterButton} ${showWishlistOnly ? styles.active : ''}`}
                        disabled={!isAuthenticated}
                        title={!isAuthenticated ? 'سجّل الدخول لتستخدم قائمة الأمنيات' : ''}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {showWishlistOnly && <motion.div layoutId="wishlist-highlight" className={styles.filterHighlight} />}
                        <span>قائمة الأمنيات</span>
                        <div style={{ transform: 'translateY(2px)' }}>
                            {showWishlistOnly ? <AddToListSolidIcon /> : <AddToListStrokeIcon />}
                        </div>
                    </motion.button>
                </FilterGroup>
            </div>

            {/* ROW 3: Months Strip (Only show if not TBA) */}
            {selectedYear !== 'TBA' && (
                <FilterGroup label="الأشهر:">
                    <div className={releaseStyles.monthStripContainer} ref={monthStripRef}>
                        <div className={releaseStyles.monthGroup}>
                            <motion.button 
                                className={`${styles.filterButton} ${selectedMonth === 'all' ? styles.active : ''}`}
                                onClick={() => onMonthChange('all')}
                            >
                                الكل
                                {selectedMonth === 'all' && <motion.div layoutId="month-highlight" className={styles.filterHighlight} />}
                            </motion.button>
                            
                            {ARABIC_MONTHS.map((month, idx) => (
                                <motion.button 
                                    key={idx}
                                    onClick={() => onMonthChange(idx)}
                                    className={`${styles.filterButton} ${selectedMonth === idx ? styles.active : ''}`}
                                >
                                    {month}
                                    {selectedMonth === idx && <motion.div layoutId="month-highlight" className={styles.filterHighlight} />}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </FilterGroup>
            )}
        </div>
    );

    // --- Mobile Layout ---
    const mobileFilters = (
        <>
            <div className={styles.mobileTriggerBar}>
                 <input 
                    type="search" 
                    placeholder="ابحث..." 
                    className={styles.searchInput} 
                    value={searchTerm} 
                    onChange={(e) => onSearchChange(e.target.value)} 
                />
                <FilterToggleButton onClick={() => setIsMobileFiltersOpen(prev => !prev)} hasActiveFilters={hasActiveFilters} />
            </div>

            <AnimatePresence>
                {isMobileFiltersOpen && (
                     <motion.div
                        className={styles.collapsibleFilterContent}
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                         <FilterGroup label="الزمن:">
                            {/* Mobile Year Popover */}
                            <div style={{ position: 'relative' }}>
                                <PopoverTriggerButton 
                                    label={`السنة: ${selectedYear}`} 
                                    isActive={true} 
                                    onClick={() => togglePopover('year')} 
                                    layoutId="mobile-year"
                                />
                                <AnimatePresence>{openPopover === 'year' && <><div className={styles.popoverBackdrop} onClick={closePopover}></div><YearFilterPopover availableYears={availableYears} selectedYear={selectedYear} onSelect={(y) => { onYearChange(y); closePopover(); }} onClose={closePopover} /></>}</AnimatePresence>
                            </div>

                            {/* Mobile Month Popover (Only if not TBA) */}
                            {selectedYear !== 'TBA' && (
                                <div style={{ position: 'relative' }}>
                                    <PopoverTriggerButton 
                                        label={selectedMonth === 'all' ? 'الشهر: الكل' : `الشهر: ${ARABIC_MONTHS[selectedMonth]}`} 
                                        isActive={selectedMonth !== 'all'} 
                                        onClick={() => togglePopover('month')} 
                                        layoutId="mobile-month"
                                    />
                                    <AnimatePresence>{openPopover === 'month' && <><div className={styles.popoverBackdrop} onClick={closePopover}></div><MonthFilterPopover selectedMonth={selectedMonth} onSelect={(m) => { onMonthChange(m); closePopover(); }} onClose={closePopover} /></>}</AnimatePresence>
                                </div>
                            )}
                        </FilterGroup>

                        <FilterGroup label="المنصة:">
                             <motion.button onClick={() => onPlatformChange('all')} className={`${styles.filterButton} ${selectedPlatform === 'all' ? styles.active : ''}`}>
                                الكل
                                {selectedPlatform === 'all' && <motion.div layoutId="mobile-plat-hl" className={styles.filterHighlight} />}
                            </motion.button>
                             {PLATFORMS.map(p => {
                                const Icon = PlatformIcons[p];
                                return (
                                    <motion.button key={p} onClick={() => onPlatformChange(p)} className={`${styles.filterButton} ${selectedPlatform === p ? styles.active : ''}`} style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                                        {selectedPlatform === p && <motion.div layoutId="mobile-plat-hl" className={styles.filterHighlight} />}
                                        <span>{p === 'PlayStation' ? 'PS5' : p}</span>
                                        <Icon width={16} height={16}/>
                                    </motion.button>
                                );
                            })}
                        </FilterGroup>

                        <FilterGroup label="إجراءات:">
                            <motion.button 
                                onClick={() => { handleJump(); setIsMobileFiltersOpen(false); }} 
                                className={`${styles.filterButton} ${releaseStyles.actionButtonMobile}`}
                            >
                                <span>الإنتقال لهذا الشهر</span>
                                <div style={{ transform: 'translateY(2px)' }}><ArrowDownIcon /></div>
                            </motion.button>
                            <motion.button 
                                onClick={onToggleWishlist} 
                                disabled={!isAuthenticated} 
                                className={`${styles.filterButton} ${releaseStyles.actionButtonMobile} ${showWishlistOnly ? styles.active : ''}`}
                            >
                                {showWishlistOnly && <motion.div layoutId="mobile-wish-hl" className={styles.filterHighlight} />}
                                <span>قائمة الأمنيات</span>
                                <div style={{ transform: 'translateY(2px)' }}>
                                    {showWishlistOnly ? <AddToListSolidIcon /> : <AddToListStrokeIcon />}
                                </div>
                            </motion.button>
                        </FilterGroup>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    return (
        <FilterContainer ref={popoverRef}>
            {isMobile ? mobileFilters : desktopFilters}
        </FilterContainer>
    );
}


