// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import GameHubClient from '@/components/GameHubClient';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useLenis } from 'lenis/react';
import SpaceBackground from '@/components/ui/SpaceBackground';
import { pageview } from '@/lib/gtm'; 
import { useUIStore } from '@/lib/uiStore';
import styles from './KineticOverlayManager.module.css';
import Footer from '@/components/Footer'; // <--- IMPORT FOOTER

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
        savedScrollPosition,
        fetchLinkedContent // <--- NEW ACTION
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
            
            // FETCH LINKED CONTENT FOR GAMES
            if (activeType === 'releases') {
                fetchLinkedContent(activeSlug);
            }
        }
    }, [isOverlayOpen, activeSlug, activeType, fetchLinkedContent]);

    // --- SCROLL FREEZE & SWAP LOGIC ---
    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        // NOTE: We do NOT hide the footer anymore globally, we just overlay it.
        // But we DO need to hide the main page footer to prevent double footers if the overlay isn't fully opaque (it is opaque/blurred).
        const mainFooter = document.querySelector('body > footer') as HTMLElement; 

        if (isOverlayOpen) {
            const scrollbarWidth = window.innerWidth - html.clientWidth;

            if (lenis) lenis.stop();
            
            body.style.paddingRight = `${scrollbarWidth}px`; 
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
            
            if (mainFooter) mainFooter.style.display = 'none';

            if (overlayRef.current) {
                setOverlayScrollRef(overlayRef.current);
                overlayRef.current.scrollTop = 0;
            }

        } else {
            body.style.paddingRight = '';
            html.style.overflow = '';
            body.style.overflow = '';
            
            if (mainFooter) mainFooter.style.display = '';

            if (lenis) lenis.start();

            const currentScroll = window.scrollY;
            if (currentScroll === 0 && savedScrollPosition > 0) {
                 window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
            }
            
            setOverlayScrollRef(null);
        }

        return () => {
            body.style.paddingRight = '';
            html.style.overflow = '';
            body.style.overflow = '';
            if (lenis) lenis.start();
        }
    }, [isOverlayOpen, savedScrollPosition, lenis, setOverlayScrollRef]);

    const activeItem = activeSlug ? contentMap.get(activeSlug) : null;

    useEffect(() => {
        if (isOverlayOpen && !activeItem && activeSlug) {
            // Fallback: If data missing, close overlay (forces router nav if clicked again)
             // Or trigger a fetch here if we want to support deep linking into overlay (Phase 2)
            closeOverlay();
        }
    }, [isOverlayOpen, activeItem, activeSlug, closeOverlay]);

    if (!activeItem) return null;

    const isRelease = activeType === 'releases';

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
                            // Raise above global Navbar (1070) to hide it, 
                            // OR keep it below if we want the global navbar. 
                            // User requested "Navbar... here". Let's assume Global Navbar stays visible.
                            // Global Navbar is z-index: 1070.
                            // We put BG at 1060.
                            zIndex: 1060, 
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
                            // Content must be above BG (1060) but BELOW Global Navbar (1070) 
                            // so the Global Navbar remains interactive.
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
                        <div style={{ direction: 'rtl', minHeight: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flexGrow: 1 }}>
                                {isRelease ? (
                                    <GameHubClient
                                        gameTitle={activeItem.title}
                                        items={activeItem.linkedContent || []} 
                                        synopsis={activeItem.synopsis}
                                        releaseTags={activeItem.tags || []}
                                        mainImage={activeItem.mainImage}
                                        price={activeItem.price}
                                        developer={activeItem.developer?.title}
                                        publisher={activeItem.publisher?.title}
                                        platforms={activeItem.platforms}
                                        onGamePass={activeItem.onGamePass}
                                        onPSPlus={activeItem.onPSPlus}
                                        forcedLayoutIdPrefix={sourceLayoutId || undefined}
                                    />
                                ) : (
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
                                )}
                            </div>
                            
                            {/* Injected Footer for Overlay */}
                            <Footer />
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}