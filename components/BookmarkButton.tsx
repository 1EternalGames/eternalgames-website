// components/BookmarkButton.tsx
'use client';

import React from 'react';
import { useUserStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import ActionButton from './ActionButton';

const iconVariants = {
    unmarked: { scale: 1, rotate: 0 },
    marked: {
        rotate: [0, -5, 5, -2, 2, 0],
        scale: 1,
        transition: { rotate: { duration: 0.5, ease: 'easeInOut' as const } }
    },
};

const fillVariants = {
    unmarked: { opacity: 0, transition: { duration: 0.2 } },
    marked: { opacity: 1, transition: { duration: 0.3, ease: 'easeIn' as const } },
};

const BookmarkIcon = () => (
    <div style={{ position: 'relative', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <motion.svg
            width="24" height="24" viewBox="0 0 24"
            fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute' }}
            variants={fillVariants}
        >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </motion.svg>
    </div>
);

const BookmarkButton = ({ contentId, contentType }: { contentId: number; contentType: string; }) => {
    const { status } = useSession();
    const { bookmarks, toggleBookmark, setSignInModalOpen } = useUserStore();
    
    const contentKey = `${contentType}-${contentId}`;
    const isBookmarked = bookmarks.includes(contentKey);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status !== 'authenticated') {
            setSignInModalOpen(true);
            return;
        }
        toggleBookmark(contentId, contentType);
    };

    return (
        <ActionButton
            onClick={handleClick}
            aria-label="إحفظ"
        >
            <motion.div
                initial={false}
                animate={isBookmarked ? "marked" : "unmarked"}
                variants={iconVariants}
            >
                <BookmarkIcon />
            </motion.div>
        </ActionButton>
    );
};

export default BookmarkButton;


