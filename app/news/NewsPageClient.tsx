// app/news/NewsPageClient.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { SanityNews, SanityGame, SanityTag } from '@/types/sanity';
import { motion, AnimatePresence } from 'framer-motion';
import NewsHero from '@/components/news/NewsHero';
import NewsFilters from '@/components/filters/NewsFilters';
import NewsGrid from '@/components/news/NewsGrid';
import { ContentBlock } from '@/components/ContentBlock';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function NewsPageClient({ heroArticles, initialGridArticles, allGames, allTags }: {
  heroArticles: SanityNews[];
  initialGridArticles: SanityNews[];
  allGames: SanityGame[];
  allTags: SanityTag[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const adaptedHeroArticles = useMemo(() => heroArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [heroArticles]);
    const newsItems = useMemo(() => initialGridArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridArticles]);

    // Initialize filter state from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [activeSort, setActiveSort] = useState<'latest' | 'viral'>((searchParams.get('sort') as any) || 'latest');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
        const gameSlug = searchParams.get('game');
        return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
    });
    const [selectedTags, setSelectedTags] = useState<SanityTag[]>(() => {
        const tagSlugs = searchParams.get('tags')?.split(',') || [];
        return allTags.filter(t => tagSlugs.includes(t.slug));
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (searchTerm) params.set('q', searchTerm); else params.delete('q');
        if (activeSort !== 'latest') params.set('sort', activeSort); else params.delete('sort');
        if (selectedGame) params.set('game', selectedGame.slug); else params.delete('game');
        if (selectedTags.length > 0) params.set('tags', selectedTags.map(t => t.slug).join(',')); else params.delete('tags');

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchTerm, activeSort, selectedGame, selectedTags, router, pathname, searchParams]);

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
                    <NewsGrid news={newsItems} />

                    {newsItems.length === 0 && (
                        <motion.p key="no-match" style={{textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            لا توجد أخبار تطابق ما اخترت.
                        </motion.p>
                    )}
                </ContentBlock>
            </div>
        </div>
    );
}