// components/releases/ReleasesControlBar.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import styles from './ReleasesControlBar.module.css';
import { PlatformIcons, PlatformNames } from '@/components/TimelineCard'; // Assuming export

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const TargetIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
    </svg>
);

// Arabic Month Names for filtering
const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

interface ReleasesControlBarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    showWishlistOnly: boolean;
    onToggleWishlist: () => void;
    onJumpToNow: () => void;
    isAuthenticated: boolean;
    // New Props
    selectedYear: number;
    onYearChange: (year: number) => void;
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
    
    // Platform List (Fixed)
    const platforms = ['PC', 'PlayStation', 'Xbox', 'Switch'];

    return (
        <motion.div 
            className={styles.controlBar}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            {/* TOP ROW: Search & Main Filters */}
            <div className={styles.mainControlsRow}>
                <div className={styles.rightControls}>
                    <div className={styles.searchWrapper}>
                        <div className={styles.searchIcon}><SearchIcon /></div>
                        <input 
                            type="text" 
                            placeholder="ابحث..." 
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    
                    {/* Platform Filter */}
                    <div className={styles.platformToggles}>
                        <button 
                            className={`${styles.filterChip} ${selectedPlatform === 'all' ? styles.active : ''}`}
                            onClick={() => onPlatformChange('all')}
                        >
                            الكل
                        </button>
                        {platforms.map(p => (
                            <button 
                                key={p}
                                className={`${styles.filterChip} ${selectedPlatform === p ? styles.active : ''}`}
                                onClick={() => onPlatformChange(p)}
                            >
                                {p === 'PlayStation' ? 'PS5' : p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.leftControls}>
                    <button onClick={onJumpToNow} className={styles.controlButton} title="إلى الحاضر">
                        <TargetIcon />
                    </button>
                    <button 
                        onClick={onToggleWishlist}
                        className={`${styles.controlButton} ${showWishlistOnly ? styles.active : ''} ${styles.wishlistButton}`}
                        disabled={!isAuthenticated}
                    >
                        <HeartIcon filled={showWishlistOnly} />
                    </button>
                </div>
            </div>

            {/* BOTTOM ROW: Time Navigation */}
            <div className={styles.timeControlsRow}>
                {/* Year Select */}
                <select 
                    className={styles.yearSelect}
                    value={selectedYear}
                    onChange={(e) => onYearChange(parseInt(e.target.value))}
                >
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>

                {/* Month Strip (Desktop) */}
                <div className={styles.monthStrip}>
                    <button 
                        className={`${styles.monthChip} ${selectedMonth === 'all' ? styles.active : ''}`}
                        onClick={() => onMonthChange('all')}
                    >
                        الكل
                    </button>
                    {ARABIC_MONTHS.map((month, idx) => (
                        <button 
                            key={idx}
                            className={`${styles.monthChip} ${selectedMonth === idx ? styles.active : ''}`}
                            onClick={() => onMonthChange(idx)}
                        >
                            {month}
                        </button>
                    ))}
                </div>

                {/* Month Select (Mobile Only) */}
                <select 
                    className={styles.mobileMonthSelect}
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                >
                    <option value="all">كل الأشهر</option>
                    {ARABIC_MONTHS.map((month, idx) => (
                        <option key={idx} value={idx}>{month}</option>
                    ))}
                </select>
            </div>
        </motion.div>
    );
}