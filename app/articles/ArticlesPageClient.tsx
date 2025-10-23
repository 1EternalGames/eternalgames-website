// app/articles/ArticlesPageClient.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import HorizontalShowcase from '@/components/HorizontalShowcase';
import ArticleFilters from '@/components/filters/ArticleFilters';
import ArticleGrid from '@/components/ArticleGrid';
import { ContentBlock } from '@/components/ContentBlock';
import Image from 'next/image';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import { useEngagementScores } from '@/hooks/useEngagementScores';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './ArticlesPage.module.css';

export default function ArticlesPageClient({ featuredArticles, gridArticles, allGames, allGameTags, allArticleTypeTags }: {
  featuredArticles: SanityArticle[];
  gridArticles: SanityArticle[];
  allGames: SanityGame[];
  allGameTags: SanityTag[];
  allArticleTypeTags: SanityTag[];
}) {
  const searchParams = useSearchParams();
  const engagementScores = useEngagementScores();

  const [activeIndex, setActiveIndex] = useState(() => 0);
  const [sortOrder, setSortOrder] = useState(() => 'latest'); 
  const [searchTerm, setSearchTerm] = useState(() => '');
  
  const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
    const gameSlug = searchParams.get('game');
    return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
  });
  const [selectedGameTags, setSelectedGameTags] = useState<SanityTag[]>(() => {
    const tagSlugs = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    return tagSlugs.map(slug => allGameTags.find(t => t.slug === slug)).filter((t): t is SanityTag => !!t);
  });
  const [selectedArticleType, setSelectedArticleType] = useState<SanityTag | null>(null);
  
  const featuredForShowcase = useMemo(() => featuredArticles.map(adaptToCardProps).filter(Boolean), [featuredArticles]);
  const activeBackgroundUrl = featuredForShowcase[activeIndex]?.imageUrl;

  const handleGameSelect = (game: SanityGame | null) => setSelectedGame(game);
  
  const handleGameTagToggle = useCallback((tag: SanityTag) => {
      const newTags = selectedGameTags.some(t => t._id === tag._id) ? selectedGameTags.filter(t => t._id !== tag._id) : [...selectedGameTags, tag];
      setSelectedGameTags(newTags);
  }, [selectedGameTags]);

  const handleArticleTypeSelect = (tag: SanityTag | null) => {
    setSelectedArticleType(tag);
  };
  
  const handleClearAllFilters = () => {
    setSelectedGame(null);
    setSelectedGameTags([]);
    setSelectedArticleType(null);
    setSearchTerm('');
  };

  const filteredAndSortedGridArticles = useMemo(() => {
    const scoresMap = new Map(engagementScores.map(s => [s.id, s.engagementScore]));
    let articles = gridArticles;

    if (searchTerm) {
        articles = articles.filter(article => article.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedGame) {
        articles = articles.filter(article => article.game?._id === selectedGame._id);
    }
    if (selectedGameTags.length > 0) {
        const selectedTagIds = new Set(selectedGameTags.map(t => t._id));
        articles = articles.filter(article => (article.tags || []).some(tagRef => tagRef && selectedTagIds.has(tagRef._id)));
    }
    if (selectedArticleType) {
        articles = articles.filter(article => (article.tags || []).some(tagRef => tagRef && tagRef._id === selectedArticleType._id));
    }

    if (sortOrder === 'viral') {
      articles.sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0));
    } else {
      articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    
    return articles.map(adaptToCardProps).filter(Boolean);

  }, [gridArticles, sortOrder, searchTerm, selectedGame, selectedGameTags, selectedArticleType, engagementScores]);

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
                onGameSelect={handleGameSelect}
                allGameTags={allGameTags}
                selectedGameTags={selectedGameTags}
                onGameTagToggle={handleGameTagToggle}
                allArticleTypeTags={allArticleTypeTags}
                selectedArticleType={selectedArticleType}
                onArticleTypeSelect={handleArticleTypeSelect}
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


