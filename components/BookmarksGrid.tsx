// components/BookmarksGrid.tsx

'use client';

import { useUserStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import { adaptToCardProps } from '@/lib/adapters';
import { CardProps } from '@/types';

export default function BookmarksGrid({ initialItems }: { initialItems: any[] }) {
    const bookmarksFromStore = useUserStore(state => state.bookmarks);
    
    // THE FIX: Wrap in arrow function and apply width optimization for grid
    const initialBookmarkedItems = initialItems
        .map(item => adaptToCardProps(item, { width: 600 }))
        .filter(Boolean) as CardProps[];
    
    const [bookmarkedItems, setBookmarkedItems] = useState<CardProps[]>(initialBookmarkedItems);

    useEffect(() => {
        // The keys being compared must use the numeric `legacyId`
        // to match the format used in the Zustand store (e.g., 'review-101').
        const currentKeysInGrid = new Set(bookmarkedItems.map(item => `${item.type}-${item.legacyId}`));
        
        if (bookmarksFromStore.length < currentKeysInGrid.size) {
            // An item was removed from the store, so remove it from the displayed grid.
            setBookmarkedItems(prev => prev.filter(item => bookmarksFromStore.includes(`${item.type}-${item.legacyId}`)));
        }
    }, [bookmarksFromStore, bookmarkedItems]);

    if (initialItems.length === 0 && bookmarkedItems.length === 0) {
        return <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>لم تحفظ شيئًا بعد.</p>;
    }

    return (
        <motion.div layout className="content-grid">
            <AnimatePresence>
                {bookmarkedItems.map(item => (
                    <motion.div
                        key={`bookmark-${item.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring' as const, stiffness: 250, damping: 25 }}
                        style={{ height: '100%' }}
                    >
                        <ArticleCard
                            article={item}
                            layoutIdPrefix="bookmark"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}


