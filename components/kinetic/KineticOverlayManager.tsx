// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useLenis } from 'lenis/react';
import SpaceBackground from '@/components/ui/SpaceBackground';
import { pageview } from '@/lib/gtm'; 
import { useUIStore } from '@/lib/uiStore';
import styles from './KineticOverlayManager.module.css';

export default function KineticOverlayManager({ colorDictionary }: { colorDictionary: any[] }) {
    const { 
        isOverlayOpen, 
        activeSlug, 
        activeType, 
        contentMap, 
        closeOverlay, 
        navigateInternal,
        sourceLayoutId, 
        activeImageSrc,
        savedScrollPosition 
    } = useContentStore();
    
    const setPrefix = useLayoutIdStore((s) => s.setPrefix);
    const setOverlayScrollRef = useUIStore((s) => s.setOverlayScrollRef);
    const overlayRef = useRef<HTMLDivElement>(null);
    
    const lenis = useLenis();

    useEffect(() => {
        if (isOverlayOpen && sourceLayoutId) {
            setPrefix(sourceLayoutId);
        }
    }, [isOverlayOpen, sourceLayoutId, setPrefix]);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.overlay === true && event.state.slug) {
                navigateInternal(event.state.slug, event.state.type);
            } else if (isOverlayOpen) {
                closeOverlay();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOverlayOpen, closeOverlay, navigateInternal]);

    useEffect(() => {
        if (isOverlayOpen && activeSlug && activeType) {
            const virtualUrl = `/${activeType}/${activeSlug}`;
            pageview(virtualUrl);
        }
    }, [isOverlayOpen, activeSlug, activeType]);

    // --- SCROLL FREEZE & SWAP LOGIC ---
    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const footer = document.querySelector('footer');

        if (isOverlayOpen) {
            // 1. Calculate Scrollbar Width
            const scrollbarWidth = window.innerWidth - html.clientWidth;

            // 2. STOP Scrolling Engine
            if (lenis) lenis.stop();
            
            // 3. LOCK Body & HTML
            // Compensate for scrollbar removal to prevent horizontal shift
            body.style.paddingRight = `${scrollbarWidth}px`; 
            
            // Freeze native scroll
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
            
            // Hide footer to prevent it from peeking or being scrolled to
            if (footer) footer.style.display = 'none';

            // 4. ACTIVATE OVERLAY SCROLL
            if (overlayRef.current) {
                setOverlayScrollRef(overlayRef.current);
                overlayRef.current.scrollTop = 0;
            }

        } else {
            // UNFREEZE
            body.style.paddingRight = '';
            html.style.overflow = '';
            body.style.overflow = '';
            
            if (footer) footer.style.display = '';

            // RESUME LENIS
            if (lenis) lenis.start();

            // Safety restoration of scroll if browser reset it
            const currentScroll = window.scrollY;
            if (currentScroll === 0 && savedScrollPosition > 0) {
                 window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
            }
            
            setOverlayScrollRef(null);
        }

        return () => {
            // Cleanup
            body.style.paddingRight = '';
            html.style.overflow = '';
            body.style.overflow = '';
            if (lenis) lenis.start();
        }
    }, [isOverlayOpen, savedScrollPosition, lenis, setOverlayScrollRef]);

    const activeItem = activeSlug ? contentMap.get(activeSlug) : null;

    useEffect(() => {
        if (isOverlayOpen && !activeItem && activeSlug) {
            closeOverlay();
        }
    }, [isOverlayOpen, activeItem, activeSlug, closeOverlay]);

    if (!activeItem) return null;

    return (
        <AnimatePresence mode="wait">
            {isOverlayOpen && activeItem && (
                <>
                    {/* Background Layer covering everything */}
                    <motion.div
                        key="overlay-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }} 
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1064, 
                            backgroundColor: 'var(--bg-primary)',
                            transform: 'translateZ(0)',
                            pointerEvents: 'auto' 
                        }}
                    >
                        <SpaceBackground />
                    </motion.div>

                    {/* Scrollable Overlay Container */}
                    <div
                        key="kinetic-content-wrapper"
                        ref={overlayRef}
                        className={styles.overlayScrollContainer}
                        style={{
                            position: 'fixed', 
                            inset: 0,
                            zIndex: 1065, 
                            paddingTop: 0, 
                            overflowY: 'auto', 
                            overflowX: 'hidden',
                            isolation: 'isolate',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain',
                            direction: 'ltr', 
                            pointerEvents: 'auto'
                        }}
                    >
                        {/* RESTORE RTL ALIGNMENT FOR CONTENT */}
                        <div style={{ direction: 'rtl', minHeight: '100%', width: '100%' }}>
                            <ContentPageClient 
                                key={activeSlug} 
                                item={activeItem} 
                                type={activeType as any} 
                                colorDictionary={colorDictionary}
                                forcedLayoutIdPrefix={sourceLayoutId || undefined}
                                initialImageSrc={activeImageSrc || undefined}
                                scrollContainerRef={overlayRef}
                            >
                                <div style={{ marginTop: '4rem' }}>
                                    <CommentSection 
                                        slug={activeSlug || ''} 
                                        contentType={activeType === 'reviews' ? 'reviews' : activeType === 'articles' ? 'articles' : 'news'} 
                                    />
                                </div>
                            </ContentPageClient>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}