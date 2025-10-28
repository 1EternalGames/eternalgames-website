// app/articles/ArticlesPageClient.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import HorizontalShowcase from '@/components/HorizontalShowcase';
import ArticleFilters from '@/components/filters/ArticleFilters';
import ArticleGrid from '@/components/ArticleGrid';
import { ContentBlock } from '@/components/ContentBlock';
import Image from 'next/image';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import { useContentFilters, ContentFilters } from '@/hooks/useContentFilters';
import { useUrlState } from '@/hooks/useUrlState';
import { adaptToCardProps } from '@/lib/adapters';
import styles from '@/components/HorizontalShowcase.module.css'; // <-- THE FIX: Import the merged stylesheet

export default function ArticlesPageClient({ featuredArticles, gridArticles, allGames, allGameTags, allArticleTypeTags }: {
  featuredArticles: SanityArticle[];
  gridArticles: SanityArticle[];
  allGames: SanityGame[];
  allGameTags: SanityTag[];
  allArticleTypeTags: SanityTag[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [searchTerm, setSearchTerm] = useUrlState({
    param: 'q',
    defaultValue: '',
    serialize: v => v || undefined,
    deserialize: v => v || '',
  });

  const [sortOrder, setSortOrder] = useUrlState({
    param: 'sort',
    defaultValue: 'latest' as 'latest' | 'viral',
    serialize: v => v === 'latest' ? undefined : v,
    deserialize: v => (v === 'viral' ? 'viral' : 'latest'),
  });

  const deserializeGame = useCallback((v: string | null) => allGames.find(g => g.slug === v) || null, [allGames]);
  const [selectedGame, setSelectedGame] = useUrlState({
    param: 'game',
    defaultValue: null as SanityGame | null,
    serialize: v => v?.slug,
    deserialize: deserializeGame,
  });

  const deserializeGameTags = useCallback((v: string | null) => v ? v.split(',').map(slug => allGameTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t) : [], [allGameTags]);
  const [selectedGameTags, setSelectedGameTags] = useUrlState({
    param: 'tags',
    defaultValue: [] as SanityTag[],
    serialize: v => v.length > 0 ? v.map(t => t.slug).join(',') : undefined,
    deserialize: deserializeGameTags,
  });
  
  const deserializeArticleType = useCallback((v: string | null) => allArticleTypeTags.find(t => t.slug === v) || null, [allArticleTypeTags]);
  const [selectedArticleType, setSelectedArticleType] = useUrlState({
    param: 'type',
    defaultValue: null as SanityTag | null,
    serialize: v => v?.slug,
    deserialize: deserializeArticleType,
  });

  const handleGameTagToggle = (tag: SanityTag) => {
    setSelectedGameTags(prev => 
      prev.some(t => t._id === tag._id) 
        ? prev.filter(t => t._id !== tag._id) 
        : [...prev, tag]
    );
  };
  
  const handleClearAllFilters = () => {
    setSelectedGame(null);
    setSelectedGameTags([]);
    setSelectedArticleType(null);
    setSearchTerm('');
  };

  const filters: ContentFilters = useMemo(() => {
    const allTags = [...selectedGameTags];
    if (selectedArticleType) {
        allTags.push(selectedArticleType);
    }
    return {
        sort: sortOrder,
        searchTerm: searchTerm,
        game: selectedGame,
        tags: allTags
    };
  }, [sortOrder, searchTerm, selectedGame, selectedGameTags, selectedArticleType]);

  const filteredAndSortedGridArticles = useContentFilters(gridArticles, filters);

  const featuredForShowcase = useMemo(() => featuredArticles.map(adaptToCardProps).filter(Boolean), [featuredArticles]);
  const activeBackgroundUrl = featuredForShowcase[activeIndex]?.imageUrl;

  return (
    <React.Fragment>
      <AnimatedGridBackground />
      <div className={styles.articlesPageContainer}>
        <AnimatePresence>
          {activeBackgroundUrl && (
            <motion.div key={activeBackgroundUrl} className={styles.articlesPageBg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Image src={activeBackgroundUrl} alt="Dynamic background" fill style={{ objectFit: 'cover' }} />
              <div className={styles.articlesPageBgOverlay} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '80vh' }}>
          <h1 className="page-title" style={{ color: '#fff', textShadow: '0 3px 15px rgba(0,0,0,0.5)', fontSize: '5rem', marginTop: '0.7rem', marginBottom: '-2rem' }}>ديوان الفن</h1>
          
          <div style={{ marginBottom: '2rem' }}>
            <HorizontalShowcase articles={featuredForShowcase} onActiveIndexChange={setActiveIndex} />
          </div>
          
          <div style={{marginTop: '-2rem'}}> 
            <ContentBlock title="جميع المقالات">
              <ArticleFilters 
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                allGames={allGames}
                selectedGame={selectedGame}
                onGameSelect={setSelectedGame}
                allGameTags={allGameTags}
                selectedGameTags={selectedGameTags}
                onGameTagToggle={handleGameTagToggle}
                allArticleTypeTags={allArticleTypeTags}
                selectedArticleType={selectedArticleType}
                onArticleTypeSelect={setSelectedArticleType}
                onClearAllFilters={handleClearAllFilters}
              />
              {filteredAndSortedGridArticles.length > 0 ? (
                  <ArticleGrid articles={filteredAndSortedGridArticles} />
              ) : (
                  <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0'}}>لم نعثر على مقالات تطابق مرادك.</p>
              )}
            </ContentBlock>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}