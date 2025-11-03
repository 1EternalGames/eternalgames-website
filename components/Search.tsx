// components/Search.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { SanitySearchResult } from '@/types/sanity';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './Search.module.css';

const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const overlayVariants = { hidden: { opacity: 0, backdropFilter: 'blur(0px)' }, visible: { opacity: 1, backdropFilter: 'blur(12px)' } };
const containerVariants = { hidden: { y: '-10vh', opacity: 0, scale: 0.98, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } }, visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 25 } } };
const listVariants = { visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } } };
const resultItemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Search({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SanitySearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebounce(query, 250);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
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

    const getLinkPath = (item: SanitySearchResult) => {
        switch (item._type) {
            case 'review': return `/reviews/${item.slug}`;
            case 'article': return `/articles/${item.slug}`;
            case 'news': return `/news/${item.slug}`;
            default: return '/';
        }
    };

    const hasContent = useMemo(() => query.length >= 3 && results.length > 0, [query, results]);
    const isInitialPrompt = query.length < 3;
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className={styles.searchOverlay} onClick={onClose} variants={overlayVariants} initial="hidden" animate="visible" exit="hidden" style={{ zIndex: 2000 }} >
                    <motion.div className={styles.searchContainer} onClick={(e) => e.stopPropagation()} variants={containerVariants} initial="hidden" animate="visible" exit="hidden" >
                        <button className={styles.searchCloseButton} onClick={onClose} aria-label="Close search"><CrossIcon /></button>
                        <input ref={inputRef} type="search" className={styles.searchInput} placeholder="استنطاق الأرشيف" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <div className={styles.searchResultsList}>
                            <AnimatePresence mode="wait">
                                {isInitialPrompt && (<motion.p key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.searchInitialPrompt}>خُطَّ حروفك لاستنطاق السجلات.</motion.p> )}
                                {isSearching && (<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '50px', height: '50px', borderTopColor: 'var(--accent)' }} /></motion.div> )}
                                {hasContent && (
                                    <motion.ul key="results" variants={listVariants} initial="hidden" animate="visible" exit="hidden" >
                                        {results.map(result => (
                                            <motion.li key={result._id} variants={resultItemVariants}>
                                                <Link href={getLinkPath(result)} onClick={onClose} className={`${styles.searchResultLink} no-underline`}>
                                                    <motion.div className={styles.searchResultThumbnail}>
                                                        {result.imageUrl ? (<Image src={result.imageUrl} alt={result.title} width={100} height={60} className={styles.searchResultImage} sizes="100px" />) : (<div className={styles.searchResultImageFallback} />)}
                                                    </motion.div>
                                                    <div className={styles.searchResultDetails}>
                                                        <h4>{result.title}</h4>
                                                        <p style={{ textTransform: 'capitalize' }}>
                                                            {result._type === 'review' && `مراجعة • ${formatDate(result.publishedAt)}`}
                                                            {result._type === 'article' && `مقالة • ${formatDate(result.publishedAt)}`}
                                                            {result._type === 'news' && `خبر • ${formatDate(result.publishedAt)}`}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                )}
                                {!isSearching && query.length >= 3 && results.length === 0 && (<motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: 'var(--text-secondary)', marginTop: '3rem', textAlign: 'center', fontSize: '2.4rem' }}><p>لا أثر في السجلات لـ &quot;{query}&quot;.</p></motion.div>)}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


