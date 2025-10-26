// app/news/NewsPageClient.tsx
'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import NewsFilterBar from '@/components/filters/NewsFilterBar';
import TerminalTicker from '@/components/TerminalTicker';
import ArticleCard from '@/components/ArticleCard'; // <-- Changed from NewsCard to ArticleCard
import { useEngagementScores } from '@/hooks/useEngagementScores'; // <-- RE-INTRODUCE HOOK
import { adaptToCardProps } from '@/lib/adapters';
import styles from './NewsPage.module.css';

type SortOption = 'latest' | 'viral';
type NewsTypeFilter = 'الكل' | 'Internal' | 'External';

export default function NewsPageClient({
  allNews, latestHeadlines, allGames, allTags
}: {
  allNews: SanityNews[]; latestHeadlines: SanityNews[]; allGames: SanityGame[]; allTags: SanityTag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const engagementScores = useEngagementScores(); // <-- FETCH SCORES ON CLIENT
  
  const [activeCategory, setActiveCategory] = useState<string>(() => searchParams.get('category') || 'الكل');
  const [activeSort, setActiveSort] = useState<SortOption>(() => (searchParams.get('sort') as SortOption) || 'latest');
  const [newsTypeFilter, setNewsTypeFilter] = useState<NewsTypeFilter>(() => (searchParams.get('type') as NewsTypeFilter) || 'الكل');
  const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
    const gameSlug = searchParams.get('game');
    return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
  });
  const [selectedTags, setSelectedTags] = useState<SanityTag[]>(() => {
    const tagSlugs = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    return tagSlugs.map(slug => allTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t);
  });

  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, amount: 0.1 });

  const allCategories = useMemo(() => ['الكل', ...Array.from(new Set(allNews.map(s => s.category)))], [allNews]);

  const updateURL = useCallback((sort: SortOption, category: string, type: NewsTypeFilter, game: SanityGame | null, tags: SanityTag[]) => {
    const params = new URLSearchParams();
    if (sort !== 'latest') params.set('sort', sort);
    if (category !== 'الكل') params.set('category', category);
    if (type !== 'الكل') params.set('type', type);
    if (game) params.set('game', game.slug);
    if (tags.length > 0) params.set('tags', tags.map(t => t.slug).join(','));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handleSortChange = (sort: SortOption) => { setActiveSort(sort); updateURL(sort, activeCategory, newsTypeFilter, selectedGame, selectedTags); };
  const handleTypeChange = (type: NewsTypeFilter) => { setNewsTypeFilter(type); updateURL(activeSort, activeCategory, type, selectedGame, selectedTags); };
  const handleCategoryChange = (cat: string) => { setActiveCategory(cat); updateURL(activeSort, cat, newsTypeFilter, selectedGame, selectedTags); };
  const handleGameSelect = (game: SanityGame | null) => { setSelectedGame(game); updateURL(activeSort, activeCategory, newsTypeFilter, game, selectedTags); };
  const handleTagToggle = (tag: SanityTag) => { const newTags = selectedTags.some(t => t._id === tag._id) ? selectedTags.filter(t => t._id !== tag._id) : [...selectedTags, tag]; setSelectedTags(newTags); updateURL(activeSort, activeCategory, newsTypeFilter, selectedGame, newTags); };
  const handleClearAll = () => { setSelectedGame(null); setSelectedTags([]); updateURL(activeSort, activeCategory, newsTypeFilter, null, []); };

  const filteredNews = useMemo(() => {
    const scoresMap = new Map(engagementScores.map(s => [s.id, s.engagementScore]));
    let reviews = allNews;
    if (newsTypeFilter === 'Internal') { reviews = reviews.filter((r: any) => r.gameRef); }
    else if (newsTypeFilter === 'External') { reviews = reviews.filter((r: any) => !r.gameRef); }
    if (activeCategory !== 'الكل') { reviews = reviews.filter((r: any) => r.category === activeCategory); }
    if (selectedGame) { reviews = reviews.filter((r: any) => r.gameRef === selectedGame._id); }
    if (selectedTags.length > 0) { const selectedTagIds = new Set(selectedTags.map(t => t._id)); reviews = reviews.filter((r: any) => (r.tags || []).some((tagRef: any) => tagRef && selectedTagIds.has(tagRef._id))); }
    if (activeSort === 'viral') { reviews.sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0)); }
    else { reviews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()); }
    return reviews.map(adaptToCardProps).filter(Boolean);
  }, [allNews, activeCategory, selectedGame, selectedTags, activeSort, engagementScores, newsTypeFilter]);

  const containerVariants = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <>
      <AnimatedGridBackground />
      <div className="container page-container">
        <h1 className="page-title">موجز الأنباء</h1>
        <motion.div ref={contentRef} variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <NewsFilterBar allCategories={allCategories} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} allGames={allGames} selectedGame={selectedGame} onGameSelect={handleGameSelect} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} activeSort={activeSort} onSortChange={handleSortChange} newsTypeFilter={newsTypeFilter} onNewsTypeChange={handleTypeChange} />
        </motion.div>
        <motion.div className={styles.chronosFeedLayout} initial="hidden" animate={isInView ? 'visible' : 'hidden'} transition={{ delay: 0.15 }}>
          <main className="chronos-feed-main">
            <motion.div layout className={styles.neuralCascadeGrid}>
              <AnimatePresence>
                {filteredNews.map((item, index) => (
                    <motion.div key={item.id} layout className={index === 0 ? styles.leadStoryItem : ''} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ type: 'spring', stiffness: 250, damping: 25 }}>
                      <ArticleCard // Now using ArticleCard
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