// app/releases/ReleasePageClient.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import type { SanityGameRelease } from '@/types/sanity';
import TimelineCard from '@/components/TimelineCard';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import styles from './ReleasesPage.module.css';
import filterStyles from '@/components/filters/Filters.module.css';

type Platform = 'الكل' | 'PC' | 'PS5' | 'Xbox' | 'Switch';
const PLATFORMS: Platform[] = ['الكل', 'PC', 'PS5', 'Xbox', 'Switch'];
const PLATFORM_LABELS: Record<Platform, string> = { 'الكل': 'الكل', 'PC': 'PC', 'PS5': 'PS5', 'Xbox': 'Xbox', 'Switch': 'Switch' };

const PlatformFilters = ({ activeFilter, onFilterChange }: { activeFilter: Platform, onFilterChange: (platform: Platform) => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const animationVariants = { 
    hidden: { opacity: 0, y: 50 }, 
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } } 
  };

  return (
    <motion.div ref={ref} variants={animationVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'} className={styles.platformFilters}>
      <span>تصفية حسب المنصة:</span>
      <div className={filterStyles.filterButtonsGroup}>
        {PLATFORMS.map(platform => {
          const isActive = activeFilter === platform;
          return (
            <motion.button 
                key={platform} 
                onClick={() => onFilterChange(platform)} 
                className={`${filterStyles.filterButton} ${isActive ? filterStyles.active : ''}`} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
            >
              {PLATFORM_LABELS[platform]}
              {isActive && ( <motion.div layoutId="release-filter-highlight" className={filterStyles.filterHighlight} transition={{ type: 'spring', stiffness: 300, damping: 25 }}/> )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default function ReleasePageClient({ releases }: { releases: SanityGameRelease[] }) {
  const [activeFilter, setActiveFilter] = useState<Platform>('الكل');
  const mainRef = useRef(null);
  const isInView = useInView(mainRef, { once: true, amount: 0.1 });
  
  const flatAnimatedContent = useMemo(() => {
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const sortedReleases = [...releases].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    
    const isFilteringActive = activeFilter !== 'الكل';
    const filteredReleases = isFilteringActive 
        ? sortedReleases.filter(release => release.platforms && release.platforms.includes(activeFilter)) 
        : sortedReleases;
    
    let currentMonth = '';
    let flatList: { type: 'header' | 'card', key: string, data: SanityGameRelease | string }[] = [];

    filteredReleases.forEach(release => {
      const date = new Date(release.releaseDate);
      const monthIndex = date.getUTCMonth();
      const monthLabel = `${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}`;
      
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        flatList.push({ type: 'header', key: `header-${monthLabel}-${date.getFullYear()}`, data: monthLabel });
      }
      flatList.push({ type: 'card', key: `card-${release._id}`, data: release });
    });
    return flatList;
  }, [releases, activeFilter]);

  const cardVariants = { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.8 }, };
  const isListEmpty = flatAnimatedContent.length === 0 && activeFilter !== 'الكل';

  return (
    <div className={styles.chronoStreamLayoutWrapper}>
      <div className={styles.chronoContentWrapper}>
          <h1 className="page-title">الإصدارات القادمة لسنة 2025</h1>
          <PlatformFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>
      <div ref={mainRef} className={styles.chronoTimelineSections} style={{ position: 'relative' }}>
          <motion.div layout className={styles.chronoGamesGrid} initial="hidden" animate={isInView ? "visible" : "hidden"} transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
            <AnimatePresence>
              {isListEmpty ? (
                <motion.p key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0', gridColumn: '1 / -1'}}>
                  لا إصدارات لهذه المنصة بعد.
                </motion.p>
              ) : (
                flatAnimatedContent.map(item => {
                  if (item.type === 'header') {
                    return (
                      <motion.div key={item.key} layout style={{ gridColumn: '1 / -1', padding: '1rem 0 0 0', display: 'flex', justifyContent: 'flex-start' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className={styles.timelineMonthTitle}>{item.data as string}</h2>
                      </motion.div>
                    );
                  }
                  const release = item.data as SanityGameRelease;
                  return (
                    <motion.div key={item.key} layout variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
                      <TimelineCard release={release} />
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
      </div>
    </div>
  );
}