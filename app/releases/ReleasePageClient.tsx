// app/releases/ReleasePageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { SanityGameRelease } from '@/types/sanity';
import TimelineCard from '@/components/TimelineCard';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import styles from './ReleasesPage.module.css';
import ReleasesControlBar from '@/components/releases/ReleasesControlBar';
import PinnedReleases from '@/components/releases/PinnedReleases';
import { useUserStore } from '@/lib/store';
import { useSession } from 'next-auth/react';

export default function ReleasePageClient({ releases, hideHeader = false }: { releases: SanityGameRelease[], hideHeader?: boolean }) {
  const { data: session } = useSession();
  const { bookmarks, setSignInModalOpen } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // New Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'TBA'>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string | 'all'>('all');
  
  const mainRef = useRef(null);
  const isInView = useInView(mainRef, { once: true, amount: 0.1 });
  
  const handleToggleWishlist = () => {
    if (!session) { setSignInModalOpen(true); return; }
    setShowWishlistOnly(prev => !prev);
  };
  
  const userRoles = (session?.user as any)?.roles || [];
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

  const handleJumpToNow = () => {
      const now = new Date();
      const monthIdx = now.getMonth();
      const year = now.getFullYear();
      
      setSelectedYear(year);
      if (selectedMonth !== 'all' && selectedMonth !== monthIdx) {
          setSelectedMonth(monthIdx);
      } else {
          const elements = document.querySelectorAll(`[id^="month-header-${monthIdx}"]`);
          if (elements.length > 0) { elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }
  };

  // 1. Compute Available Years
  const availableYears = useMemo(() => {
      const years = new Set(releases.map(r => r.isTBA ? 'TBA' : new Date(r.releaseDate).getFullYear()));
      const yearArray = Array.from(years).filter(y => y !== 'TBA') as number[];
      return yearArray.sort((a, b) => b - a);
  }, [releases]);

  // 2. Separate Pinned Games
  const { pinnedGames, timelineGames } = useMemo(() => {
      const explicitPins = releases.filter(r => r.isPinned);
      let pinned: SanityGameRelease[] = [];
      let timeline: SanityGameRelease[] = [];

      if (explicitPins.length > 0) {
          pinned = explicitPins;
          timeline = releases.filter(r => !r.isPinned);
      } else {
          // If nothing pinned, take top 3 upcoming non-TBA
          const upcoming = releases.filter(r => !r.isTBA && new Date(r.releaseDate) >= new Date()).sort((a,b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
          pinned = upcoming.slice(0, 3);
          timeline = releases; 
      }
      return { pinnedGames: pinned, timelineGames: timeline };
  }, [releases]);

  // 3. Filter Timeline Games
  const filteredTimeline = useMemo(() => {
      let filtered = timelineGames;

      // Year Filter (Handles TBA specifically)
      if (selectedYear === 'TBA') {
          filtered = filtered.filter(r => r.isTBA);
      } else {
          // If a specific year is selected, exclude TBAs and match year
          filtered = filtered.filter(r => !r.isTBA && new Date(r.releaseDate).getFullYear() === selectedYear);
      }

      // Month Filter (Only applies if not TBA)
      if (selectedMonth !== 'all' && selectedYear !== 'TBA') {
          filtered = filtered.filter(r => new Date(r.releaseDate).getMonth() === selectedMonth);
      }

      if (selectedPlatform !== 'all') {
          filtered = filtered.filter(r => {
              if (!r.platforms) return false;
              if (selectedPlatform === 'PlayStation') {
                  return r.platforms.includes('PlayStation') || r.platforms.includes('PlayStation 5');
              }
              return r.platforms.includes(selectedPlatform as any);
          });
      }

      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(r => r.title.toLowerCase().includes(lowerTerm));
      }

      if (showWishlistOnly) {
          filtered = filtered.filter(r => bookmarks.includes(`release-${r.legacyId}`));
      }

      return filtered;
  }, [timelineGames, selectedYear, selectedMonth, selectedPlatform, searchTerm, showWishlistOnly, bookmarks]);
  
  // 4. Group by Month
  const flatAnimatedContent = useMemo(() => {
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    const sortedReleases = [...filteredTimeline].sort((a, b) => {
         // Primary Sort: TBA status
         if (a.isTBA && !b.isTBA) return 1;
         if (!a.isTBA && b.isTBA) return -1;
         
         // Secondary Sort: Date
         const dateA = new Date(a.releaseDate).getTime();
         const dateB = new Date(b.releaseDate).getTime();
         if (dateA !== dateB) return dateA - dateB;

         // Tertiary Sort: Date Precision (Day < Month < Year)
         // This ensures "Year Only" (2025) comes AFTER "December 2025" even if both are stored as 12-31
         const weight = (p?: string) => p === 'year' ? 3 : (p === 'month' ? 2 : 1);
         return weight(a.datePrecision) - weight(b.datePrecision);
    });
    
    let currentMonth = '';
    let flatList: { type: 'header' | 'card', key: string, data: SanityGameRelease | string, monthIndex?: number }[] = [];

    sortedReleases.forEach(release => {
      let monthLabel = '';
      let monthIdx = -1;

      if (release.isTBA) {
          monthLabel = 'موعد غير معلن'; 
      } else if (release.datePrecision === 'year') {
          monthLabel = 'شهر غير معلن'; // Special group for Year-only precision
      } else {
          const date = new Date(release.releaseDate);
          monthIdx = date.getMonth();
          monthLabel = `${arabicMonths[monthIdx]}`;
      }
      
      if (monthLabel && monthLabel !== currentMonth) {
          if (selectedYear === 'TBA') {
               if (flatList.length === 0) {
                   currentMonth = monthLabel;
                   flatList.push({ type: 'header', key: `header-${monthLabel}`, data: monthLabel, monthIndex: -1 });
               }
          } else {
               currentMonth = monthLabel;
               flatList.push({ type: 'header', key: `header-${monthLabel}`, data: monthLabel, monthIndex: monthIdx });
          }
      }
      flatList.push({ type: 'card', key: `card-${release._id}`, data: release });
    });
    return flatList;
  }, [filteredTimeline, selectedYear]);

  const cardVariants = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };

  return (
    <div className={styles.chronoStreamLayoutWrapper}>
      <div className={styles.chronoContentWrapper}>
          {!hideHeader && (
              <h1 className="page-title">إصدارات {selectedYear === 'TBA' ? 'قادمة (TBA)' : selectedYear}</h1>
          )}
          
          <PinnedReleases 
            items={pinnedGames} 
            showAdminControls={isAdmin} // Pass Admin Prop
          />

          <ReleasesControlBar 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              showWishlistOnly={showWishlistOnly}
              onToggleWishlist={handleToggleWishlist}
              onJumpToNow={handleJumpToNow}
              isAuthenticated={!!session}
              
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              availableYears={availableYears}
          />
      </div>
      
      <div ref={mainRef} className={styles.chronoTimelineSections}>
          <motion.div layout className={styles.chronoGamesGrid} initial="hidden" animate={isInView ? "visible" : "hidden"}>
            <AnimatePresence mode="popLayout">
              {flatAnimatedContent.length === 0 ? (
                <motion.p key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0', gridColumn: '1 / -1', fontSize: '1.6rem'}}>
                  لا توجد إصدارات تطابق بحثك.
                </motion.p>
              ) : (
                flatAnimatedContent.map(item => {
                  if (item.type === 'header') {
                    return (
                      <motion.div 
                        key={item.key} 
                        layout 
                        id={item.monthIndex !== undefined && item.monthIndex !== -1 ? `month-header-${item.monthIndex}` : undefined}
                        className={styles.stickyHeaderWrapper} 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      >
                        <h2 className={styles.timelineMonthTitle}>{item.data as string}</h2>
                      </motion.div>
                    );
                  }
                  const release = item.data as SanityGameRelease;
                  return (
                    <motion.div key={item.key} layout variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
                      <TimelineCard 
                        release={release} 
                        showAdminControls={isAdmin} 
                        autoHeight={false} 
                      />
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


