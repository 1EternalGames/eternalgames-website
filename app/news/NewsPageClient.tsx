// components/news/NewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect, startTransition, useCallback } from 'react';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import NewsHero from '@/components/news/NewsHero';
import NewsFilters from '@/components/filters/NewsFilters';
import NewsGrid from '@/components/news/NewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from './NewsPage.module.css';
import { NewsIcon } from '@/components/icons';
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel';
import NewsItemSkeleton from '@/components/ui/NewsItemSkeleton';
import { useContentStore } from '@/lib/contentStore';
import { batchFetchFullContentAction } from '@/app/actions/batchActions';
import { loadMoreNews } from '@/app/actions/batchActions';

const fetchNews = async (params: URLSearchParams) => {
    const res = await fetch(`/api/news?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
};

export default function NewsPageClient({ heroArticles, initialGridArticles, allGames, allTags }: { heroArticles: SanityNews[]; initialGridArticles: SanityNews[]; allGames: SanityGame[]; allTags: SanityTag[]; }) {
    const { hydrateContent, pageMap, hydrateIndex, appendToSection } = useContentStore();

    // --- OPTIMIZATION: Deferred Rendering State ---
    const [isGridReady, setIsGridReady] = useState(false);
    useEffect(() => {
        const t = requestAnimationFrame(() => {
            startTransition(() => setIsGridReady(true));
        });
        return () => cancelAnimationFrame(t);
    }, []);
    // ----------------------------------------

    const storedData = pageMap.get('news');
    const hasStoredData = storedData && storedData.grid && storedData.grid.length >= initialGridArticles.length;
    
    const sourceGrid = hasStoredData ? storedData.grid : initialGridArticles;
    const initialOffset = hasStoredData ? storedData.nextOffset : initialGridArticles.length;

    const adaptedHeroArticles = useMemo(() => heroArticles.map(item => adaptToCardProps(item, { width: 800 })).filter(Boolean) as CardProps[], [heroArticles]);
    const initialCards = useMemo(() => sourceGrid.map((item: any) => adaptToCardProps(item, { width: 600 })).filter(Boolean) as CardProps[], [sourceGrid]);
    
    const [allFetchedNews, setAllFetchedNews] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (!hasStoredData) {
            hydrateIndex('news', {
                hero: heroArticles,
                grid: initialGridArticles,
                allGames: allGames,
                allTags: allTags,
                nextOffset: initialGridArticles.length
            });
        }
    }, [hasStoredData, hydrateIndex, heroArticles, initialGridArticles, allGames, allTags]);
    
    const [nextOffset, setNextOffset] = useState<number | null>(initialOffset);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'viral'>('latest');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);
    
    const newsItems = useMemo(() => {
        let items = [...allFetchedNews];
        if (searchTerm) items = items.filter(news => news.title.toLowerCase().includes(searchTerm.toLowerCase()));
        if (selectedGame) items = items.filter(news => news.game === selectedGame.title);
        if (selectedTags.length > 0) {
            const selectedTagTitles = new Set(selectedTags.map(t => t.title));
            items = items.filter(news => news.tags.some(t => selectedTagTitles.has(t.title)));
        }
        return items;
    }, [allFetchedNews, searchTerm, selectedGame, selectedTags]);

    const hasActiveFilters = useMemo(() => {
        return !!searchTerm || !!selectedGame || selectedTags.length > 0 || activeSort !== 'latest';
    }, [searchTerm, selectedGame, selectedTags, activeSort]);

    const canLoadMore = nextOffset !== null && !hasActiveFilters && !isLoading && isGridReady;

    const handleLoadMore = useCallback(async () => {
        if (!canLoadMore) return;
        setIsLoading(true);
        
        try {
            const result = await loadMoreNews({
                offset: nextOffset as number,
                limit: 50,
                sort: activeSort,
            });

            const newItems = result.cards.filter((newItem: CardProps) => !allFetchedNews.some(p => p.id === newItem.id));
            
            if (newItems.length > 0) {
                 hydrateContent(result.fullContent);
                 appendToSection('news', result.fullContent, result.nextOffset);
                 setAllFetchedNews(prev => [...prev, ...newItems]);
            }
            
            setNextOffset(result.nextOffset);

        } catch (error) {
            console.error("Failed to load more news:", error);
        } finally {
            setIsLoading(false);
        }
    }, [canLoadMore, nextOffset, activeSort, allFetchedNews, hydrateContent, appendToSection]);

    const handleTagToggle = (tag: SanityTag) => {
        setSelectedTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]);
    };
    const handleClearAll = () => {
        setSearchTerm('');
        setSelectedGame(null);
        setSelectedTags([]);
        setActiveSort('latest');
    };

    return (
        <div style={{ paddingBottom: '6rem' }}>
            <NewsHero newsItems={adaptedHeroArticles} />
            
            {/* Render grid only if ready */}
            {isGridReady ? (
                <div className="container">
                    <NewsFilters activeSort={activeSort} onSortChange={setActiveSort} searchTerm={searchTerm} onSearchChange={setSearchTerm} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allTags={allTags} selectedTags={selectedTags} onTagToggle={handleTagToggle} onClearAll={handleClearAll} />
                    <ContentBlock title="كل الأخبار" Icon={NewsIcon}>
                        <NewsGrid news={newsItems} />

                        <InfiniteScrollSentinel onIntersect={handleLoadMore} />
                        
                        <AnimatePresence>
                            {isLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem' }}>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><NewsItemSkeleton /></motion.div>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><NewsItemSkeleton /></motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {(!isLoading && newsItems.length > 0 && (nextOffset === null || hasActiveFilters)) && (
                                <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {hasActiveFilters ? 'أزِل المرشحات للمزيد.' : 'بلغتَ المنتهى.'}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {newsItems.length === 0 && !isLoading && (
                            <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                لا أنباءَ توافقُ ما اخترت.
                            </motion.p>
                        )}
                    </ContentBlock>
                </div>
            ) : (
                 <div className="container" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    );
}