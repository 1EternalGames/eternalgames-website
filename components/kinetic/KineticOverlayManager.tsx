// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import GameHubClient from '@/components/GameHubClient';
import CreatorHubClient from '@/components/CreatorHubClient';
import HubPageClient from '@/components/HubPageClient';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useLenis } from 'lenis/react';
import SpaceBackground from '@/components/ui/SpaceBackground';
import { pageview } from '@/lib/gtm'; 
import { useUIStore } from '@/lib/uiStore';
import styles from './KineticOverlayManager.module.css';
import Footer from '@/components/Footer'; 
import ReviewsPageClient from '@/app/reviews/ReviewsPageClient';
import ArticlesPageClient from '@/app/articles/ArticlesPageClient';
import NewsPageClient from '@/app/news/NewsPageClient';
import ReleasePageClient from '@/app/releases/ReleasePageClient';
import { usePathname, useSearchParams } from 'next/navigation';

export default function KineticOverlayManager({ colorDictionary }: { colorDictionary: any[] }) {
    const { 
        isOverlayOpen, 
        activeSlug, 
        activeType, 
        contentMap, 
        creatorMap, 
        tagMap, 
        pageMap,
        indexSection,
        closeOverlay, 
        forceCloseOverlay,
        navigateInternal,
        sourceLayoutId, 
        activeImageSrc,
        savedScrollPosition,
        fetchLinkedContent,
        fetchCreatorContent,
        fetchTagContent,
        fetchFullContent,
        fetchCreatorByUsername 
    } = useContentStore();
    
    const setPrefix = useLayoutIdStore((s) => s.setPrefix);
    const setOverlayScrollRef = useUIStore((s) => s.setOverlayScrollRef);
    const overlayRef = useRef<HTMLDivElement>(null);
    const lenis = useLenis();
    
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (isOverlayOpen) {
            const state = typeof window !== 'undefined' ? window.history.state : null;
            if (!state?.overlay) {
                forceCloseOverlay();
            }
        }
    }, [pathname, searchParams, isOverlayOpen, forceCloseOverlay]);

    useEffect(() => {
        if (isOverlayOpen && sourceLayoutId) {
            setPrefix(sourceLayoutId);
        }
    }, [isOverlayOpen, sourceLayoutId, setPrefix]);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.overlay === true) {
                navigateInternal(event.state.slug || event.state.section, event.state.type);
            } else if (isOverlayOpen) {
                closeOverlay();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOverlayOpen, closeOverlay, navigateInternal]);

    useEffect(() => {
        if (isOverlayOpen && activeSlug && activeType) {
            if (activeType === 'index' && indexSection) {
                 pageview(`/${indexSection}`);
            } else if (activeType === 'creators') {
                const creator = creatorMap.get(activeSlug);
                
                // CRITICAL FIX: Only fetch if we DON'T have the content loaded flag set.
                // The store update in hydration ensures this flag is true if data was pre-fetched.
                if (!creator || !creator.contentLoaded) {
                    const id = creator && (creator.prismaUserId || creator._id);
                    if (id) {
                         fetchCreatorContent(activeSlug, id);
                    } else {
                         // Fallback for direct URL or missing ID
                         fetchCreatorByUsername(activeSlug);
                    }
                }
                pageview(`/creators/${activeSlug}`);
            } else if (activeType === 'tags') {
                fetchTagContent(activeSlug);
                pageview(`/tags/${activeSlug}`);
            } else {
                const virtualUrl = `/${activeType}/${activeSlug}`;
                pageview(virtualUrl);
                if (activeType === 'releases' || (activeType as string) === 'games') {
                    fetchLinkedContent(activeSlug);
                } else if (activeType === 'reviews' || activeType === 'articles' || activeType === 'news') {
                    fetchFullContent(activeSlug);
                }
            }
        }
    }, [isOverlayOpen, activeSlug, activeType, fetchLinkedContent, fetchCreatorContent, fetchTagContent, fetchFullContent, indexSection, creatorMap, tagMap, fetchCreatorByUsername]);

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

    const renderContent = useMemo(() => {
        if (!isOverlayOpen) return null;

        const activeItem = activeSlug ? contentMap.get(activeSlug) : null;
        const activeIndexData = indexSection ? pageMap.get(indexSection) : null;
        const activeCreator = (activeSlug && activeType === 'creators') ? creatorMap.get(activeSlug) : null;
        const activeTag = (activeSlug && activeType === 'tags') ? tagMap.get(activeSlug) : null;

        if (activeType === 'index' && activeIndexData) {
            let content = null;
            let paddingTop = '0';
            
            switch(indexSection) {
                case 'reviews': content = <ReviewsPageClient heroReview={activeIndexData.hero} initialGridReviews={activeIndexData.grid} allGames={activeIndexData.allGames} allTags={activeIndexData.allTags} />; break;
                case 'articles': content = <ArticlesPageClient featuredArticles={activeIndexData.featured} initialGridArticles={activeIndexData.grid} allGames={activeIndexData.allGames} allGameTags={activeIndexData.allGameTags} allArticleTypeTags={activeIndexData.allArticleTypeTags} />; break;
                case 'news': content = <NewsPageClient heroArticles={activeIndexData.hero} initialGridArticles={activeIndexData.grid} allGames={activeIndexData.allGames} allTags={activeIndexData.allTags} />; break;
                case 'releases': 
                    paddingTop = 'calc(var(--nav-height-scrolled) + 4rem)';
                    content = <ReleasePageClient releases={activeIndexData.releases} />; 
                    break;
            }
            return { content, paddingTop };
        } 
        
        if (activeType === 'creators') {
            // FIX: Render client if we have the creator object, even if content loading is pending.
            // The loading state is now correctly managed in the useEffect, which avoids the double fetch.
            if (activeCreator) {
                const isLoading = !activeCreator.contentLoaded;
                return {
                    content: <CreatorHubClient 
                        creatorName={activeCreator.name} 
                        username={activeCreator.username} 
                        image={activeCreator.image} 
                        bio={activeCreator.bio} 
                        items={activeCreator.linkedContent || []} 
                        scrollContainerRef={overlayRef} 
                        // @ts-ignore
                        isLoading={isLoading}
                    />,
                    paddingTop: '0'
                };
            }
            // Only show full spinner if we have ZERO data about the creator (e.g. direct URL loading)
            return { content: <div className="container" style={{height:'80vh', display:'flex', justifyContent:'center', alignItems:'center'}}><div className="spinner"></div></div>, paddingTop: '0' };
        } 
        
        if (activeType === 'tags') {
            if (activeTag && activeTag.contentLoaded) {
                 return {
                    content: <HubPageClient initialItems={activeTag.items || []} hubTitle={activeTag.title} hubType="وسم" scrollContainerRef={overlayRef} />,
                    paddingTop: '0'
                 };
            }
            return { content: <div className="container" style={{height:'80vh', display:'flex', justifyContent:'center', alignItems:'center'}}><div className="spinner"></div></div>, paddingTop: '0' };
        } 
        
        if (activeItem) {
             if (activeType === 'releases' || (activeType as string) === 'games') {
                return {
                    content: <GameHubClient gameTitle={activeItem.title} items={activeItem.linkedContent || []} synopsis={activeItem.synopsis} releaseTags={activeItem.tags || []} mainImage={activeItem.mainImage} price={activeItem.price} developer={activeItem.developer?.title} publisher={activeItem.publisher?.title} platforms={activeItem.platforms} onGamePass={activeItem.onGamePass} onPSPlus={activeItem.onPSPlus} forcedLayoutIdPrefix={sourceLayoutId || undefined} scrollContainerRef={overlayRef} />,
                    paddingTop: '0'
                };
             } else {
                 return {
                    content: (
                        <ContentPageClient key={activeSlug} item={activeItem} type={activeType as any} colorDictionary={colorDictionary} forcedLayoutIdPrefix={sourceLayoutId || undefined} initialImageSrc={activeImageSrc || undefined} scrollContainerRef={overlayRef}> 
                            <div style={{ marginTop: '4rem' }}> <CommentSection slug={activeSlug || ''} contentType={activeType === 'reviews' ? 'reviews' : activeType === 'articles' ? 'articles' : 'news'} /> </div> 
                        </ContentPageClient>
                    ),
                    paddingTop: '0'
                 };
             }
        }
        
        return { content: <div className="container" style={{height:'80vh', display:'flex', justifyContent:'center', alignItems:'center'}}><div className="spinner"></div></div>, paddingTop: '0' };

    }, [isOverlayOpen, activeSlug, activeType, indexSection, contentMap, creatorMap, tagMap, pageMap, colorDictionary, sourceLayoutId, activeImageSrc]);

    return (
        <AnimatePresence mode="wait">
            {isOverlayOpen && renderContent && (
                <motion.div 
                    key="overlay-root"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }} 
                    style={{ position: 'fixed', inset: 0, zIndex: 1060, transform: 'translateZ(0)' }}
                >
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: 'var(--bg-primary)', pointerEvents: 'auto' }}>
                         <SpaceBackground />
                    </div>

                    <div 
                        ref={overlayRef} 
                        className={styles.overlayScrollContainer} 
                        style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            zIndex: 1, 
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
                        <div style={{ direction: 'rtl', minHeight: '100%', width: '100%', display: 'flex', flexDirection: 'column', paddingTop: renderContent.paddingTop }}>
                            <div style={{ flexGrow: 1 }}>
                                {renderContent.content}
                            </div>
                            <Footer />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}