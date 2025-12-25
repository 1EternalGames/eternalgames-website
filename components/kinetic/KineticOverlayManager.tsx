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
import { pageview } from '@/lib/gtm'; // Import Google Analytics helper

export default function KineticOverlayManager({ colorDictionary }: { colorDictionary: any[] }) {
    const { 
        isOverlayOpen, 
        activeSlug, 
        activeType, 
        contentMap, 
        closeOverlay, 
        navigateInternal,
        savedScrollPosition, 
        sourceLayoutId, 
        activeImageSrc 
    } = useContentStore();
    
    const setPrefix = useLayoutIdStore((s) => s.setPrefix);
    const scrollRestoredRef = useRef(false);
    
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

    // --- ANALYTICS TRACKER ---
    useEffect(() => {
        if (isOverlayOpen && activeSlug && activeType) {
            const virtualUrl = `/${activeType}/${activeSlug}`;
            pageview(virtualUrl);
        }
    }, [isOverlayOpen, activeSlug, activeType]);

    useLayoutEffect(() => {
        const mainContent = document.getElementById('main-content');
        const footer = document.querySelector('footer');
        
        if (isOverlayOpen) {
            scrollRestoredRef.current = false;
            
            if (mainContent) {
                mainContent.style.position = 'fixed';
                mainContent.style.top = `-${savedScrollPosition}px`;
                mainContent.style.width = '100%';
                mainContent.style.left = '0';
            }

            if (footer) {
                footer.style.display = 'none';
            }

            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }

            document.body.classList.add('force-scrolled-nav');
            
            // Scroll overlay to top instantly
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            if (lenis) {
                lenis.scrollTo(0, { immediate: true, force: true, lock: false });
            }

        } else {
            document.body.classList.remove('force-scrolled-nav');
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
            
            if (mainContent) {
                mainContent.style.position = '';
                mainContent.style.top = '';
                mainContent.style.width = '';
                mainContent.style.left = '';
            }

            if (footer) {
                footer.style.display = '';
            }
            
            if (!scrollRestoredRef.current) {
                window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
                
                if (lenis) {
                    lenis.scrollTo(savedScrollPosition, { immediate: true, force: true });
                }
                
                scrollRestoredRef.current = true;
            }
        }
    }, [isOverlayOpen, savedScrollPosition, lenis, activeSlug]);

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
                    <motion.div
                        key="overlay-bg"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }} 
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1064, 
                            backgroundColor: 'var(--bg-primary)',
                            transform: 'translateZ(0)', 
                        }}
                    >
                        <SpaceBackground />
                    </motion.div>

                    <div
                        key="kinetic-content-wrapper"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            minHeight: '100vh',
                            zIndex: 1065, 
                            paddingTop: 0, 
                            marginBottom: '-300px',
                            isolation: 'isolate'
                        }}
                    >
                        <ContentPageClient 
                            key={activeSlug} 
                            item={activeItem} 
                            type={activeType as any} 
                            colorDictionary={colorDictionary}
                            forcedLayoutIdPrefix={sourceLayoutId || undefined}
                            initialImageSrc={activeImageSrc || undefined}
                        >
                            <div style={{ marginTop: '4rem' }}>
                                <CommentSection 
                                    slug={activeSlug || ''} 
                                    contentType={activeType === 'reviews' ? 'reviews' : activeType === 'articles' ? 'articles' : 'news'} 
                                />
                            </div>
                        </ContentPageClient>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}