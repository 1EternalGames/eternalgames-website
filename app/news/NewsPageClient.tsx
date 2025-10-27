// app/news/NewsPageClient.tsx
'use client';

import { useMemo, useRef, useCallback } from 'react';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import NewsFilterBar from '@/components/filters/NewsFilterBar';
import TerminalTicker from '@/components/TerminalTicker';
import ArticleCard from '@/components/ArticleCard';
import { useContentFilters, ContentFilters } from '@/hooks/useContentFilters';
import { useUrlState } from '@/hooks/useUrlState';
import styles from './NewsPage.module.css';

type SortOption = 'latest' | 'viral';
type NewsTypeFilter = 'الكل' | 'Internal' | 'External';

export default function NewsPageClient({
  allNews, latestHeadlines, allGames, allTags
}: {
  allNews: SanityNews[]; latestHeadlines: SanityNews[]; allGames: SanityGame[]; allTags: SanityTag[];
}) {
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, amount: 0.1 });
  const allCategories = useMemo(() => ['الكل', ...Array.from(new Set(allNews.map(s => s.category)))], [allNews]);

  const [activeCategory, setActiveCategory] = useUrlState({
    param: 'category',
    defaultValue: 'الكل',
    serialize: v => v === 'الكل' ? undefined : v,
    deserialize: v => v || 'الكل',
  });

  const [activeSort, setActiveSort] = useUrlState({
    param: 'sort',
    defaultValue: 'latest' as SortOption,
    serialize: v => v === 'latest' ? undefined : v,
    deserialize: v => v === 'viral' ? 'viral' : 'latest',
  });

  const [newsTypeFilter, setNewsTypeFilter] = useUrlState({
    param: 'type',
    defaultValue: 'الكل' as NewsTypeFilter,
    serialize: v => v === 'الكل' ? undefined : v,
    deserialize: v => (v as NewsTypeFilter) || 'الكل',
  });
  
  const deserializeGame = useCallback((v: string | null) => allGames.find(g => g.slug === v) || null, [allGames]);
  const [selectedGame, setSelectedGame] = useUrlState({
    param: 'game',
    defaultValue: null as SanityGame | null,
    serialize: v => v?.slug,
    deserialize: deserializeGame,
  });

  const deserializeTags = useCallback((v: string | null) => v ? v.split(',').map(slug => allTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t) : [], [allTags]);
  const [selectedTags, setSelectedTags] = useUrlState({
    param: 'tags',
    defaultValue: [] as SanityTag[],
    serialize: v => v.length > 0 ? v.map(t => t.slug).join(',') : undefined,
    deserialize: deserializeTags,
  });

  const handleTagToggle = (tag: SanityTag) => {
    setSelectedTags(prev => 
      prev.some(t => t._id === tag._id) 
        ? prev.filter(t => t._id !== tag._id) 
        : [...prev, tag]
    );
  };
  
  const handleClearAll = () => {
    setSelectedGame(null);
    setSelectedTags([]);
    setNewsTypeFilter('الكل');
  };
  
  const itemsForHook = useMemo(() => {
    let items = allNews;
    if (newsTypeFilter === 'Internal') items = items.filter((r: any) => r.game?.title);
    if (newsTypeFilter === 'External') items = items.filter((r: any) => !r.game?.title);
    if (activeCategory !== 'الكل') items = items.filter((r: any) => r.category === activeCategory);
    return items;
  }, [allNews, newsTypeFilter, activeCategory]);

  const filteredNews = useContentFilters(itemsForHook, {
      sort: activeSort,
      game: selectedGame,
      tags: selectedTags,
  });

  const containerVariants = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <>
      <AnimatedGridBackground />
      <div className="container page-container">
        <h1 className="page-title">موجز الأنباء</h1>
        <motion.div ref={contentRef} variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <NewsFilterBar allCategories={allCategories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} activeSort={activeSort} onSortChange={setActiveSort} newsTypeFilter={newsTypeFilter} onNewsTypeChange={setNewsTypeFilter} />
        </motion.div>
        <motion.div className={styles.chronosFeedLayout} initial="hidden" animate={isInView ? 'visible' : 'hidden'} transition={{ delay: 0.15 }}>
          <main className="chronos-feed-main">
            <motion.div layout className={styles.neuralCascadeGrid}>
              <AnimatePresence>
                {filteredNews.map((item, index) => (
                    <motion.div key={item.id} layout className={index === 0 ? styles.leadStoryItem : ''} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
                      <ArticleCard
                        article={item}
                        layoutIdPrefix="news-grid"
                      />
                    </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {filteredNews.length === 0 && ( <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0'}}>لا توجد أخبار تطابق ما اخترت.</p> )}
          </main>
          <aside className={styles.chronosFeedSidebar}>
            <TerminalTicker headlines={latestHeadlines} />
          </aside>
        </motion.div>
      </div>
    </>
  );
}