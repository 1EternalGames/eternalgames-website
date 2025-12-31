// components/Search.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanitySearchResult } from '@/types/sanity';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './Search.module.css';
import NewsGridCard from '@/components/news/NewsGridCard';
import { CardProps } from '@/types';

const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const overlayVariants = { hidden: { opacity: 0, backdropFilter: 'blur(0px)' }, visible: { opacity: 1, backdropFilter: 'blur(12px)' } };
const containerVariants = { hidden: { y: '-10vh', opacity: 0, scale: 0.98, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } }, visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } } };
const listVariants = { visible: { transition: { staggerChildren: 0.05 } } };

// FIX: Added 'as const' to the transition type to satisfy TypeScript
const resultItemVariants = { 
    hidden: { opacity: 0, y: 30 }, 
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: 'spring' as const, stiffness: 300, damping: 25 } 
    } 
};

// Mapping function to convert Search Result to CardProps
const adaptSearchResultToCard = (result: SanitySearchResult): CardProps => {
    // Format date
    const date = result.publishedAt ? new Date(result.publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

    return {
        id: result._id,
        legacyId: result.legacyId || 0,
        type: result._type,
        title: result.title,
        slug: result.slug,
        imageUrl: result.imageUrl || '/placeholder-game.jpg',
        blurDataURL: result.blurDataURL || '',
        date: date,
        // Adapt authors/reporters
        authors: (result.authors || result.reporters || []).map(a => ({
            _id: 'search-author', // minimal dummy for display
            name: a.name,
            image: a.image, // Assuming query returns image object or url
            slug: '',
            prismaUserId: ''
        })),
        tags: (result.tags || []).map(t => ({ title: t.title, slug: t.slug })),
        game: result.game,
        category: result.category,
        newsType: result.newsType,
        score: result.score,
        // Defaults
        isPinned: false,
        onGamePass: false,
        onPSPlus: false,
    };
};

export default function Search({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SanitySearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    // NEW: State to track if an item was just clicked to force unmount
    const [isItemSelected, setIsItemSelected] = useState(false);
    
    const debouncedQuery = useDebounce(query, 600);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setIsItemSelected(false); // Reset on open
            const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen, onClose]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) { setResults([]); return; }
        setIsSearching(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) throw new Error('Search failed');
            const data: SanitySearchResult[] = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => { performSearch(debouncedQuery); }, [debouncedQuery, performSearch]);

    // Handle instant close on selection
    const handleResultClick = (e: React.MouseEvent) => {
        setIsItemSelected(true);
        onClose();
    };

    const hasContent = useMemo(() => query.length >= 3 && results.length > 0, [query, results]);
    const isInitialPrompt = query.length < 3;
    
    // Logic: if item selected, force null (instant unmount) to skip exit animation
    if (isItemSelected) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                // FIX: Ensure higher z-index than Navbar (3000)
                <motion.div className={styles.searchOverlay} onClick={onClose} variants={overlayVariants} initial="hidden" animate="visible" exit="hidden" style={{ zIndex: 3000 }} >
                    <motion.div className={styles.searchContainer} onClick={(e) => e.stopPropagation()} variants={containerVariants} initial="hidden" animate="visible" exit="hidden" >
                        <button className={styles.searchCloseButton} onClick={onClose} aria-label="إغلاق البحث"><CrossIcon /></button>
                        <input ref={inputRef} type="search" className={styles.searchInput} placeholder="استنطاق الأرشيف" value={query} onChange={(e) => setQuery(e.target.value)} />
                        
                        <div className={styles.searchResultsList}>
                            <AnimatePresence mode="wait">
                                {isInitialPrompt && (<motion.p key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.searchInitialPrompt}>خُطَّ ما في نفسِكَ تُجِبْكَ السجلات.</motion.p> )}
                                {isSearching && (<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '50px', height: '50px', borderTopColor: 'var(--accent)' }} /></motion.div> )}
                                
                                {hasContent && (
                                    <motion.div 
                                        key="results" 
                                        variants={listVariants} 
                                        initial="hidden" 
                                        animate="visible" 
                                        exit="hidden"
                                        className={styles.resultsGrid}
                                    >
                                        {results.map(result => {
                                            const cardProps = adaptSearchResultToCard(result);
                                            return (
                                                <motion.div key={result._id} variants={resultItemVariants} style={{ height: 'auto' }}>
                                                    <NewsGridCard 
                                                        item={cardProps} 
                                                        layoutIdPrefix="search-results"
                                                        variant="compact"
                                                        onClick={handleResultClick}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {!isSearching && query.length >= 3 && results.length === 0 && (<motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: 'var(--text-secondary)', marginTop: '3rem', textAlign: 'center', fontSize: '2.4rem' }}><p>لا أثرَ في السجلاتِ لـ &quot;{query}&quot;.</p></motion.div>)}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}