'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '@/lib/overlayStore';
import { useContentStore } from '@/lib/contentStore';
import ContentPageClient from '@/components/content/ContentPageClient';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ContentOverlay() {
    const { isOpen, contentId, contentType, closeOverlay } = useOverlayStore();
    const { getBySlug } = useContentStore();
    const pathname = usePathname();

    // Determine the data
    const item = contentId ? getBySlug(contentId) : null;
    
    // Close overlay if real navigation happens (e.g. clicking a tag link)
    useEffect(() => {
        if (isOpen) closeOverlay();
    }, [pathname]);

    // Handle Back Button (Popstate)
    useEffect(() => {
        if (!isOpen) return;

        const handlePopState = (event: PopStateEvent) => {
            // Prevent browser from actually going back, just close overlay
            event.preventDefault();
            closeOverlay();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, closeOverlay]);

    // Lock Body Scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 2000, // Above Navbar (1070)
                        backgroundColor: 'var(--bg-primary)',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    {/* Render the full content page client inside the overlay */}
                    {/* Note: We pass empty colorDictionary for now, or you can hydrate that too if critical */}
                    <ContentPageClient 
                        item={item} 
                        type={contentType || 'news'} 
                        colorDictionary={[]} 
                    >
                        {/* No comments in overlay preview for speed/simplicity, or add them back if needed */}
                        <div />
                    </ContentPageClient>
                    
                    {/* Close Button (Floating) */}
                    <motion.button
                        onClick={() => {
                            closeOverlay();
                            // Restore URL
                            window.history.pushState(null, '', '/');
                        }}
                        style={{
                            position: 'fixed',
                            top: '2rem',
                            left: '2rem',
                            zIndex: 2001,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(220, 38, 38, 0.8)' }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}