// components/ContentActionBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/lib/store';
import BookmarkButton from './BookmarkButton';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from './ActionButton';

const iconVariants = { unliked: { scale: 1 }, liked: { scale: [1, 1.4, 1.1], transition: { duration: 0.4, ease: "easeOut" as const } }, };
const fillVariants = { unliked: { fill: 'rgba(0,0,0,0)', transition: { duration: 0.2 } }, liked: { fill: 'currentColor', transition: { duration: 0.25, delay: 0.1 } }, };
const shockwaveVariants = { unliked: { scale: 0, opacity: 0 }, liked: { scale: 1, opacity: [1, 0], transition: { duration: 0.5, ease: "easeOut" as const } } };
const HeartIcon = ({ isLiked }: { isLiked: boolean }) => ( <motion.div initial={false} animate={isLiked ? "liked" : "unliked"} variants={iconVariants} style={{ position: 'relative', display: 'flex' }}> <motion.div variants={shockwaveVariants} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid var(--accent)', borderRadius: '50%' }} /> <svg width="24" height="24" viewBox="0 0 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <motion.path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" variants={fillVariants} /> </svg> </motion.div> );
const ShareIcon = () => (<svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>);
const CheckIcon = () => (<svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);

interface ContentActionBarProps { contentId: number; contentType: 'review' | 'article' | 'news'; contentSlug: string; }

export default function ContentActionBar({ contentId, contentType, contentSlug }: ContentActionBarProps) {
    const { status } = useSession();
    const { setSignInModalOpen, likes, toggleLike, addShare } = useUserStore();
    const [justCopied, setJustCopied] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    
    useEffect(() => { setHasMounted(true); }, []);

    const contentKey = `${contentType}-${contentId}`;
    const isLiked = hasMounted && likes.includes(contentKey);

    const handleLike = () => { if (status !== 'authenticated') { setSignInModalOpen(true); return; } toggleLike(contentId, contentType, contentSlug); };
    const handleShare = async () => { const shareData = { title: `EternalGames: ${document.title}`, text: `Check out this ${contentType} on EternalGames!`, url: window.location.href }; if (navigator.share) { try { await navigator.share(shareData); if (status === 'authenticated') { addShare(contentId, contentType, contentSlug); } } catch (error) { console.log('Web Share API canceled or failed.', error); } } else { await navigator.clipboard.writeText(window.location.href); setJustCopied(true); if (status === 'authenticated') { addShare(contentId, contentType, contentSlug); } setTimeout(() => setJustCopied(false), 2000); } };

    if (!hasMounted) { return <div style={{display: 'flex', gap: '1rem', height: '44px'}}><div style={{width:'44px'}}></div><div style={{width:'44px'}}></div><div style={{width:'44px'}}></div></div>; }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ActionButton onClick={handleLike} aria-label={isLiked ? 'Unlike' : 'Like'}><HeartIcon isLiked={isLiked} /></ActionButton>
            <ActionButton onClick={handleShare} aria-label="مشاركة"><AnimatePresence mode="wait" initial={false}><motion.div key={justCopied ? 'check' : 'share'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>{justCopied ? <CheckIcon /> : <ShareIcon />}</motion.div></AnimatePresence></ActionButton>
            <BookmarkButton contentId={contentId} contentType={contentType} />
        </div>
    );
}


