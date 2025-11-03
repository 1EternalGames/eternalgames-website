// app/news/NewsPageClient.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import NewsHero from '@/components/news/NewsHero';
import NewsFilters from '@/components/filters/NewsFilters';
import NewsGrid from '@/components/news/NewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from './NewsPage.module.css';

const fetchNews = async (params: URLSearchParams) => {
    const res = await fetch(`/api/news?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
};

export default function NewsPageClient({ heroArticles, initialGridArticles, allGames, allTags }: {
  heroArticles: SanityNews[];
  initialGridArticles: SanityNews[];
  allGames: SanityGame[];
  allTags: SanityTag[];
}) {
    const intersectionRef = useRef(null);
    const isIntersecting = useInView(intersectionRef);

    const adaptedHeroArticles = useMemo(() => heroArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [heroArticles]);
    const initialCards = useMemo(() => initialGridArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridArticles]);

    const [newsItems, setNewsItems] = useState<CardProps[]>(initialCards);
    const [isLoading, setIsLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState<number | null>(initialCards.length === 50 ? 50 : null);
    const [isFeedExhausted, setIsFeedExhausted] = useState(initialCards.length < 50);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeSort, setActiveSort] = useState<'latest' | 'viral'>('latest');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(null);
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>([]);

    const currentFilters = useMemo(() => ({ searchTerm, activeSort, selectedGame, selectedTags }), [searchTerm, activeSort, selectedGame, selectedTags]);
    const hasActiveFilters = !!searchTerm || !!selectedGame || selectedTags.length > 0 || activeSort !== 'latest';

    useEffect(() => {
        const filtersAreDefault = !hasActiveFilters;
        if (filtersAreDefault) {
            setNewsItems(initialCards);
            setNextOffset(initialCards.length === 50 ? 50 : null);
            setIsFeedExhausted(initialCards.length < 50);
            return;
        }

        const fetchAndReplace = async () => {
            setIsLoading(true);
            setIsFeedExhausted(false);
            const params = new URLSearchParams({ offset: '0', limit: '50' });
            if (searchTerm) params.set('q', searchTerm);
            if (activeSort !== 'latest') params.set('sort', activeSort);
            if (selectedGame) params.set('game', selectedGame.slug);
            if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(','));

            try {
                const result = await fetchNews(params);
                setNewsItems(result.data);
                setNextOffset(result.nextOffset);
                if (!result.nextOffset) setIsFeedExhausted(true);
            } catch (error) {
                console.error("Filter change fetch failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndReplace();
    }, [currentFilters, initialCards, hasActiveFilters]);

    useEffect(() => {
        if (isIntersecting && nextOffset !== null && !isLoading) {
            const loadMore = async () => {
                setIsLoading(true);
                const params = new URLSearchParams({ offset: String(nextOffset), limit: '50' });
                if (searchTerm) params.set('q', searchTerm);
                if (activeSort !== 'latest') params.set('sort', activeSort);
                if (selectedGame) params.set('game', selectedGame.slug);
                if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(','));

                try {
                    const result = await fetchNews(params);
                    setNewsItems(prev => [...prev, ...result.data]);
                    setNextOffset(result.nextOffset);
                    if (!result.nextOffset) setIsFeedExhausted(true);
                } catch (error) {
                    console.error("Failed to load more news:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadMore();
        }
    }, [isIntersecting, nextOffset, isLoading, currentFilters]);

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
        <div className="page-container">
            <NewsHero newsItems={adaptedHeroArticles} />
            <div className="container">
                <ContentBlock title="أرشيف الأخبار">
                    <NewsFilters 
                        activeSort={activeSort}
                        onSortChange={setActiveSort}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        allGames={allGames}
                        selectedGame={selectedGame}
                        onGameSelect={setSelectedGame}
                        allTags={allTags}
                        selectedTags={selectedTags}
                        onTagToggle={handleTagToggle}
                        onClearAll={handleClearAll}
                    />
                    <NewsGrid news={newsItems} isLoading={isLoading} />
                    <AnimatePresence>
                        {(isLoading && nextOffset !== null) && (
                            <motion.div key="loading" style={{display: 'flex', justifyContent: 'center', padding: '4rem'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="spinner" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={intersectionRef} style={{ height: '1px', margin: '1rem 0' }} />
                    <AnimatePresence>
                        {(isFeedExhausted && newsItems.length > 0 && !isLoading) && (
                            <motion.p key="end" style={{textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                وصلت إلى نهاية الأرشيف.
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {(!isLoading && newsItems.length === 0 && hasActiveFilters) && (
                        <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            لا توجد أخبار تطابق ما اخترت.
                        </motion.p>
                    )}
                </ContentBlock>
            </div>
        </div>
    );
}