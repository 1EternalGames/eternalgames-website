// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
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
import Footer from '@/components/Footer'; 

// Import Page Clients
import ReviewsPageClient from '@/app/reviews/ReviewsPageClient';
import ArticlesPageClient from '@/app/articles/ArticlesPageClient';
import NewsPageClient from '@/app/news/NewsPageClient';
import ReleasePageClient from '@/app/releases/ReleasePageClient';
import { SanityArticle, SanityNews, SanityReview } from '@/types/sanity';

export default function KineticOverlayManager({ colorDictionary }: { colorDictionary: any[] }) {
    const { 
        isOverlayOpen, 
        activeSlug, 
        activeType, 
        contentMap, 
        pageMap,
        indexSection,
        closeOverlay, 
        navigateInternal,
        sourceLayoutId, 
        activeImageSrc,
        savedScrollPosition,
        fetchLinkedContent 
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
            if (event.state && event.state.overlay === true) {
                // If it's an index state or content state
                navigateInternal(event.state.slug || event.state.section, event.state.type);
            } else if (isOverlayOpen) {
                closeOverlay();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOverlayOpen, closeOverlay, navigateInternal]);

    useEffect(() => {
        if (isOverlayOpen) {
            if (activeType === 'index' && indexSection) {
                 pageview(`/${indexSection}`);
            } else if (activeSlug && activeType) {
                const virtualUrl = `/${activeType}/${activeSlug}`;
                pageview(virtualUrl);
                if (activeType === 'releases') {
                    fetchLinkedContent(activeSlug);
                }
            }
        }
    }, [isOverlayOpen, activeSlug, activeType, fetchLinkedContent, indexSection]);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
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
    const activeIndexData = indexSection ? pageMap.get(indexSection) : null;
    
    // Close if trying to view content/index that doesn't exist in store (fallback to router)
    useEffect(() => {
        if (isOverlayOpen) {
            if (activeType === 'index') {
                if (!activeIndexData) closeOverlay();
            } else {
                if (!activeItem && activeSlug) closeOverlay();
            }
        }
    }, [isOverlayOpen, activeItem, activeSlug, activeIndexData, activeType, closeOverlay]);

    if (!isOverlayOpen) return null;
    
    // Determine content to render
    let contentToRender = null;

    if (activeType === 'index' && activeIndexData) {
        switch(indexSection) {
            case 'reviews':
                contentToRender = <ReviewsPageClient heroReview={activeIndexData.hero} initialGridReviews={activeIndexData.grid} allGames={activeIndexData.allGames} allTags={activeIndexData.allTags} />;
                break;
            case 'articles':
                contentToRender = <ArticlesPageClient featuredArticles={activeIndexData.featured} initialGridArticles={activeIndexData.grid} allGames={activeIndexData.allGames} allGameTags={activeIndexData.allGameTags} allArticleTypeTags={activeIndexData.allArticleTypeTags} />;
                break;
            case 'news':
                contentToRender = <NewsPageClient heroArticles={activeIndexData.hero} initialGridArticles={activeIndexData.grid} allGames={activeIndexData.allGames} allTags={activeIndexData.allTags} />;
                break;
            case 'releases':
                contentToRender = <ReleasePageClient releases={activeIndexData.releases} />;
                break;
        }
    } else if (activeItem) {
         if (activeType === 'releases') {
            contentToRender = <GameHubClient
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
            />;
         } else {
             contentToRender = <ContentPageClient 
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
            </ContentPageClient>;
         }
    }

    if (!contentToRender) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="overlay-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} 
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1060, 
                    backgroundColor: 'var(--bg-primary)',
                    transform: 'translateZ(0)',
                    pointerEvents: 'auto' 
                }}
            >
                <SpaceBackground />
            </motion.div>

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
                <div style={{ direction: 'rtl', minHeight: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexGrow: 1 }}>
                        {contentToRender}
                    </div>
                    <Footer />
                </div>
            </div>
        </AnimatePresence>
    );
}