// app/articles/ArticlesPageClient.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanityArticle, SanityGame, SanityTag } from '@/types/sanity';
import HorizontalShowcase from '@/components/HorizontalShowcase';
import ArticleFilters from '@/components/filters/ArticleFilters';
import ArticleCard from '@/components/ArticleCard';
import Image from 'next/image';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';
import styles from '@/components/HorizontalShowcase.module.css';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

const ArrowIcon = ({ direction = 'right' }: { direction?: 'left' | 'right' }) => (
    <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={direction === 'right' ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
    </svg>
);
  
const MobileShowcase = ({ articles, onActiveIndexChange }: { articles: CardProps[], onActiveIndexChange: (index: number) => void }) => {
    const [[page, direction], setPage] = useState([0, 0]);
    const router = useRouter();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    
    const paginate = (newDirection: number) => {
        const newIndex = (page + newDirection + articles.length) % articles.length;
        setPage([newIndex, newDirection]);
        onActiveIndexChange(newIndex);
    };

    const activeArticle = articles[page];
    const layoutIdPrefix = "articles-showcase";
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setPrefix(layoutIdPrefix);
        router.push(`/articles/${activeArticle.slug}`, { scroll: false });
    };
    
    const variants = {
        enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 100 : -100 }),
        center: { opacity: 1, x: 0 },
        exit: (direction: number) => ({ opacity: 0, x: direction < 0 ? 100 : -100 }),
    };

    return (
        <div className={styles.mobileShowcaseContainer}>
             <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div key={page} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className={styles.mobileShowcaseCardWrapper} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <motion.div
                        layoutId={`${layoutIdPrefix}-card-container-${activeArticle.legacyId}`}
                        onClick={handleClick}
                        className={`no-underline ${styles.showcaseCardLink}`}
                    >
                        <motion.div layoutId={`${layoutIdPrefix}-card-image-${activeArticle.legacyId}`} className={styles.showcaseCardImageWrapper}><Image src={activeArticle.imageUrl} alt={activeArticle.title} fill sizes="80vw" style={{ objectFit: 'cover' }} className={styles.showcaseCardImage}/></motion.div>
                        <div className={styles.showcaseCardContent}><motion.h3 layoutId={`${layoutIdPrefix}-card-title-${activeArticle.legacyId}`} className={styles.showcaseCardTitle}>{activeArticle.title}</motion.h3><p className={styles.showcaseCardGame}>{activeArticle.game}</p></div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
            <button className={`${styles.showcaseArrow} ${styles.left}`} onClick={() => paginate(-1)}><ArrowIcon direction="left" /></button>
            <button className={`${styles.showcaseArrow} ${styles.right}`} onClick={() => paginate(1)}><ArrowIcon direction="right" /></button>
        </div>
    );
};


export default function ArticlesPageClient({ featuredArticles, initialGridArticles, allGames, allGameTags, allArticleTypeTags }: {
  featuredArticles: SanityArticle[]; initialGridArticles: SanityArticle[]; allGames: SanityGame[]; allGameTags: SanityTag[]; allArticleTypeTags: SanityTag[];
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    
    const gridArticles = useMemo(() => initialGridArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [initialGridArticles]);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    useEffect(() => { const checkMobile = () => setIsMobile(window.innerWidth <= 768); checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile); }, []);

    // Initialize filter state from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [sortOrder, setSortOrder] = useState<'latest' | 'viral'>((searchParams.get('sort') as any) || 'latest');
    const [selectedGame, setSelectedGame] = useState<SanityGame | null>(() => {
        const gameSlug = searchParams.get('game');
        return gameSlug ? allGames.find(g => g.slug === gameSlug) || null : null;
    });
    const [selectedGameTags, setSelectedGameTags] = useState<SanityTag[]>(() => {
        const tagSlugs = searchParams.get('tags')?.split(',') || [];
        return allGameTags.filter(t => tagSlugs.includes(t.slug));
    });
    const [selectedArticleType, setSelectedArticleType] = useState<SanityTag | null>(() => {
        // This assumes article type tags are also passed via 'tags' param
        const tagSlugs = searchParams.get('tags')?.split(',') || [];
        return allArticleTypeTags.find(t => tagSlugs.includes(t.slug)) || null;
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (searchTerm) params.set('q', searchTerm); else params.delete('q');
        if (sortOrder !== 'latest') params.set('sort', sortOrder); else params.delete('sort');
        if (selectedGame) params.set('game', selectedGame.slug); else params.delete('game');

        const allSelectedTags = [...selectedGameTags, ...(selectedArticleType ? [selectedArticleType] : [])];
        if (allSelectedTags.length > 0) {
            params.set('tags', allSelectedTags.map(t => t.slug).join(','));
        } else {
            params.delete('tags');
        }
        
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchTerm, sortOrder, selectedGame, selectedGameTags, selectedArticleType, router, pathname, searchParams]);

    const handleGameTagToggle = (tag: SanityTag) => { setSelectedGameTags(prev => prev.some(t => t._id === tag._id) ? prev.filter(t => t._id !== tag._id) : [...prev, tag]); };
    const handleClearAllFilters = () => { setSelectedGame(null); setSelectedGameTags([]); setSelectedArticleType(null); setSearchTerm(''); setSortOrder('latest'); };
    
    const featuredForShowcase = useMemo(() => featuredArticles.map(adaptToCardProps).filter(Boolean) as CardProps[], [featuredArticles]);
    const activeBackgroundUrl = featuredForShowcase[activeIndex]?.imageUrl;

    return (
        <React.Fragment>
            <AnimatedGridBackground />
            <div className={styles.articlesPageContainer}>
                <AnimatePresence>{activeBackgroundUrl && (<motion.div key={activeBackgroundUrl} className={styles.articlesPageBg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Image src={activeBackgroundUrl} alt="Dynamic background" fill style={{ objectFit: 'cover' }} /><div className={styles.articlesPageBgOverlay} /></motion.div>)}</AnimatePresence>
                <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem', minHeight: '80vh' }}>
                    <h1 className="page-title" style={{ color: '#fff', textShadow: '0 3px 15px rgba(0,0,0,0.5)', fontSize: '5rem', marginTop: '0.7rem', marginBottom: '4rem' }}>ديوان الفن</h1>
                    <div className={styles.showcaseSection}>{isMobile ? (<MobileShowcase articles={featuredForShowcase} onActiveIndexChange={setActiveIndex} />) : (<HorizontalShowcase articles={featuredForShowcase} onActiveIndexChange={setActiveIndex} />)}</div>
                    <div className={styles.gridSection}> 
                        <div style={{marginBottom: '6rem'}}>
                            <h2 className="section-title" style={{textAlign: 'right', marginBottom: '3rem', fontSize: 'clamp(2.8rem, 4vw, 3.6rem)'}}>جميع المقالات</h2>
                            <ArticleFilters sortOrder={sortOrder} onSortChange={setSortOrder} searchTerm={searchTerm} onSearchChange={setSearchTerm} allGames={allGames} selectedGame={selectedGame} onGameSelect={setSelectedGame} allGameTags={allGameTags} selectedGameTags={selectedGameTags} onGameTagToggle={handleGameTagToggle} allArticleTypeTags={allArticleTypeTags} selectedArticleType={selectedArticleType} onArticleTypeSelect={setSelectedArticleType} onClearAllFilters={handleClearAllFilters} />
                            
                            <motion.div layout className="content-grid">
                                <AnimatePresence>
                                    {gridArticles.map((article, index) => ( <ArticleCard key={article.id} article={article} layoutIdPrefix="articles-grid" isPriority={index < 3} /> ))}
                                </AnimatePresence>
                            </motion.div>

                            {gridArticles.length === 0 && ( <motion.p key="no-match" style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0'}} initial={{ opacity: 0 }} animate={{ opacity: 1 }}> لم نعثر على مقالات تطابق مرادك. </motion.p> )}
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}