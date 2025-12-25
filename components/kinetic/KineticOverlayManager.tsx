// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import { usePathname } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

export default function KineticOverlayManager({ colorDictionary }: { colorDictionary: any[] }) {
    const { isOverlayOpen, activeSlug, activeType, contentMap, closeOverlay, savedScrollPosition, sourceLayoutId } = useContentStore();
    const setPrefix = useLayoutIdStore((s) => s.setPrefix);
    const scrollRestoredRef = useRef(false);

    // Sync layout ID store for the shared element transition
    useEffect(() => {
        if (isOverlayOpen && sourceLayoutId) {
            setPrefix(sourceLayoutId);
        }
    }, [isOverlayOpen, sourceLayoutId, setPrefix]);

    // Handle Browser Back Button
    useEffect(() => {
        const handlePopState = () => {
            if (isOverlayOpen) {
                closeOverlay();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOverlayOpen, closeOverlay]);

    // SCROLL & DOM MANAGEMENT
    useLayoutEffect(() => {
        const mainContent = document.getElementById('main-content');
        
        if (isOverlayOpen) {
            scrollRestoredRef.current = false;
            
            // 1. Force Navbar to Scrolled State immediately
            document.body.classList.add('force-scrolled-nav');
            
            // 2. Scroll to top immediately so the hero is visible at y=0
            window.scrollTo(0, 0);

            // 3. Delay hiding the main content.
            // This 50ms window is where Framer Motion sees BOTH the Card (in mainContent) 
            // and the Hero (in Overlay) and calculates the interpolation.
            const timer = setTimeout(() => {
                if (mainContent) mainContent.style.display = 'none';
            }, 50); 

            return () => clearTimeout(timer);

        } else {
            // Closing...
            document.body.classList.remove('force-scrolled-nav');
            
            if (mainContent) {
                mainContent.style.display = 'block';
            }
            
            // Restore scroll position instantly
            if (!scrollRestoredRef.current && savedScrollPosition > 0) {
                window.scrollTo(0, savedScrollPosition);
                scrollRestoredRef.current = true;
            }
        }
    }, [isOverlayOpen, savedScrollPosition]);

    const activeItem = activeSlug ? contentMap.get(activeSlug) : null;

    // Auto-close if data missing (safety)
    useEffect(() => {
        if (isOverlayOpen && !activeItem) {
            closeOverlay();
        }
    }, [isOverlayOpen, activeItem, closeOverlay]);

    if (!activeItem) return null;

    return (
        <AnimatePresence>
            {isOverlayOpen && (
                <motion.div
                    key="kinetic-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        minHeight: '100vh',
                        zIndex: 1065, // Below Navbar (1070)
                        backgroundColor: 'var(--bg-primary)',
                        paddingTop: '0', // FIX: Starts at absolute 0 to show Hero behind Nav
                        marginBottom: '-300px', // Prevent footer flash
                        willChange: 'opacity'
                    }}
                >
                    <ContentPageClient 
                        item={activeItem} 
                        type={activeType as any} 
                        colorDictionary={colorDictionary}
                    >
                        <div style={{ marginTop: '4rem' }}>
                            <CommentSection 
                                slug={activeSlug || ''} 
                                contentType={activeType === 'reviews' ? 'reviews' : activeType === 'articles' ? 'articles' : 'news'} 
                            />
                        </div>
                    </ContentPageClient>
                </motion.div>
            )}
        </AnimatePresence>
    );
}