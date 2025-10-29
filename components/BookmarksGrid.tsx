// components/BookmarksGrid.tsx

'use client';

import { useUserStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import { adaptToCardProps } from '@/lib/adapters';

export default function BookmarksGrid({ initialItems }: { initialItems: any[] }) {
    // We still subscribe to the store to get real-time updates when a user bookmarks/unbookmarks.
    const bookmarksFromStore = useUserStore(state => state.bookmarks);
    
    // The initial state is now server-rendered, providing a fast first paint.
    const [bookmarkedItems, setBookmarkedItems] = useState(() => 
        initialItems.map(adaptToCardProps).filter(Boolean)
    );

    useEffect(() => {
        // This effect ensures the grid visually updates when the store changes,
        // without needing a full page refresh.
        const currentIdsInGrid = new Set(bookmarkedItems.map(item => item.id));
        
        if (bookmarksFromStore.length < currentIdsInGrid.size) {
            // An item was removed
            setBookmarkedItems(prev => prev.filter(item => bookmarksFromStore.includes(item.id)));
        }
        // Note: Adding items in real-time is more complex and would require a re-fetch.
        // This implementation prioritizes correct removal, which is the more common action on this page.

    }, [bookmarksFromStore, bookmarkedItems]);

    if (initialItems.length === 0 && bookmarkedItems.length === 0) {
        return <p>You haven&apos;t bookmarked any content yet.</p>;
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