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
  const [selectedYear, setSelectedYear] = useState(currentYear);
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
      
      // Update filters to current time
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
      const years = new Set(releases.map(r => new Date(r.releaseDate).getFullYear()));
      return Array.from(years).sort((a, b) => b - a);
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
          const pinnedIds = new Set(pinned.map(p => p._id));
          // REMOVE PINNED FROM TIMELINE so they aren't duplicated at the top
          // The previous code had `timeline = releases` here to NOT remove them.
          // But your prompt said "pinned releases will not get filtered like the others, they'll stay even when filtering and searching".
          // AND "don't make the pinned releases disappear from the list down, it will appear two times".
          // SO: timeline should include EVERYTHING (except maybe exact duplicates if logic changes, but here we KEEP them in timeline)
          timeline = releases; 
      }
      return { pinnedGames: pinned, timelineGames: timeline };
  }, [releases]);

  // 3. Filter Timeline Games
  const filteredTimeline = useMemo(() => {
      let filtered = timelineGames;

      // Year Filter
      filtered = filtered.filter(r => new Date(r.releaseDate).getFullYear() === selectedYear);

      // Month Filter
      if (selectedMonth !== 'all') {
          filtered = filtered.filter(r => new Date(r.releaseDate).getMonth() === selectedMonth);
      }

      // Platform Filter
      if (selectedPlatform !== 'all') {
          filtered = filtered.filter(r => {
              if (!r.platforms) return false;
              if (selectedPlatform === 'PlayStation') {
                  return r.platforms.includes('PlayStation') || r.platforms.includes('PlayStation 5');
              }
              return r.platforms.includes(selectedPlatform as any);
          });
      }

      // Search Filter
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(r => r.title.toLowerCase().includes(lowerTerm));
      }

      // Wishlist Filter
      if (showWishlistOnly) {
          filtered = filtered.filter(r => bookmarks.includes(`release-${r.legacyId}`));
      }

      return filtered;
  }, [timelineGames, selectedYear, selectedMonth, selectedPlatform, searchTerm, showWishlistOnly, bookmarks]);
  
  // 4. Group by Month for Rendering
  const flatAnimatedContent = useMemo(() => {
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Sort
    const sortedReleases = [...filteredTimeline].sort((a, b) => {
         if (a.isTBA && !b.isTBA) return 1;
         if (!a.isTBA && b.isTBA) return -1;
         return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    });
    
    let currentMonth = '';
    let flatList: { type: 'header' | 'card', key: string, data: SanityGameRelease | string, monthIndex?: number }[] = [];

    sortedReleases.forEach(release => {
      let monthLabel = '';
      let monthIdx = -1;

      if (release.isTBA) {
          monthLabel = 'TBA';
      } else {
          const date = new Date(release.releaseDate);
          monthIdx = date.getMonth();
          monthLabel = `${arabicMonths[monthIdx]} - ${englishMonths[monthIdx]}`;
      }
      
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        flatList.push({ type: 'header', key: `header-${monthLabel}`, data: monthLabel, monthIndex: monthIdx });
      }
      flatList.push({ type: 'card', key: `card-${release._id}`, data: release });
    });
    return flatList;
  }, [filteredTimeline]);

  const cardVariants = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };

  return (
    <div className={styles.chronoStreamLayoutWrapper}>
      <div className={styles.chronoContentWrapper}>
          {!hideHeader && (
              <h1 className="page-title">إصدارات 2025</h1>
          )}
          
          {/* Pinned Section: Now always visible, ignores filters */}
          <PinnedReleases items={pinnedGames} />

          {/* Control Bar */}
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
                        id={item.monthIndex !== undefined ? `month-header-${item.monthIndex}` : undefined}
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