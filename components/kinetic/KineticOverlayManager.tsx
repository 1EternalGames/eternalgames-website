// components/kinetic/KineticOverlayManager.tsx
'use client';

import { useEffect, useLayoutEffect, useRef, useMemo, Suspense } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useLenis } from 'lenis/react';
import Lenis from 'lenis'; // Import Lenis class for manual instantiation
import SpaceBackground from '@/components/ui/SpaceBackground';
import { pageview } from '@/lib/gtm'; 
import { useUIStore } from '@/lib/uiStore';
import { usePerformanceStore } from '@/lib/performanceStore'; // Import Performance Store
import styles from './KineticOverlayManager.module.css';
import Footer from '@/components/Footer'; 
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { translateTag } from '@/lib/translations'; 

const ReviewsPageClient = dynamic(() => import('@/app/reviews/ReviewsPageClient'), { ssr: false });
const ArticlesPageClient = dynamic(() => import('@/app/articles/ArticlesPageClient'), { ssr: false });
const NewsPageClient = dynamic(() => import('@/app/news/NewsPageClient'), { ssr: false });
const ReleasePageClient = dynamic(() => import('@/app/releases/ReleasePageClient'), { ssr: false });
const ContentPageClient = dynamic(() => import('@/components/content/ContentPageClient'), { ssr: false });
const CommentSection = dynamic(() => import('@/components/comments/CommentSection'), { ssr: false });
const GameHubClient = dynamic(() => import('@/components/GameHubClient'), { ssr: false });
const CreatorHubClient = dynamic(() => import('@/components/CreatorHubClient'), { ssr: false });
const HubPageClient = dynamic(() => import('@/components/HubPageClient'), { ssr: false });

const sectionTitles: Record<string, string> = {
    reviews: 'المراجعات',
    articles: 'المقالات',
    news: 'الأخبار',
    releases: 'الإصدارات',
};

function KineticOverlayManagerContent({ colorDictionary }: { colorDictionary: any[] }) {
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
    const { isSmoothScrollingEnabled } = usePerformanceStore(); // Check user preference
    const overlayRef = useRef<HTMLDivElement>(null);
    const mainLenis = useLenis(); // The root Lenis instance
    
    const pathname = usePathname();

    // Auto-close overlay if navigation moves to /studio
    useEffect(() => {
        if (pathname?.startsWith('/studio') && isOverlayOpen) {
            forceCloseOverlay();
        }
    }, [pathname, isOverlayOpen, forceCloseOverlay]);

    // Initialize scoped Lenis for the overlay
    useEffect(() => {
        if (isOverlayOpen && overlayRef.current && isSmoothScrollingEnabled) {
            const container = overlayRef.current;
            const content = container.firstElementChild as HTMLElement;

            const overlayLenis = new Lenis({
                wrapper: container,
                content: content,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
            });

            // Sync: When Lenis scrolls, we can optionally dispatch events or rely on its internal handling.
            // Note: Since 'wrapper' has overflow: auto (from CSS), Lenis might rely on native scroll or interfere.
            // For standard Lenis behavior on custom wrapper, we usually set overflow: hidden, 
            // but we want to keep native scrollbars visible for UX. 
            // Lenis v1+ supports this by not preventing default if configured correctly, or we just let it run.

            function raf(time: number) {
                overlayLenis.raf(time);
                requestAnimationFrame(raf);
            }
            
            const rafId = requestAnimationFrame(raf);

            return () => {
                cancelAnimationFrame(rafId);
                overlayLenis.destroy();
            };
        }
    }, [isOverlayOpen, isSmoothScrollingEnabled]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        if (isOverlayOpen) {
            const previousTitle = document.title;
            let newTitle = '';

            if (activeType === 'index' && indexSection) {
                newTitle = sectionTitles[indexSection] || 'EternalGames';
            } else if (activeType === 'creators' && activeSlug) {
                const creator = creatorMap.get(activeSlug);
                if (creator) newTitle = `أعمال ${creator.name}`;
                else newTitle = activeSlug; 
            } else if (activeType === 'tags' && activeSlug) {
                const tag = tagMap.get(activeSlug);
                if (tag) newTitle = `وسم: ${translateTag(tag.title)}`;
                else newTitle = activeSlug; 
            } else if (activeSlug) {
                const item = contentMap.get(activeSlug);
                if (item) {
                     newTitle = item.title;
                     if (activeType === 'games') newTitle = `محور لعبة: ${item.title}`;
                }
            }

            if (newTitle) {
                document.title = `${newTitle} | EternalGames`;
            }

            return () => {
                document.title = previousTitle;
            };
        }
    }, [isOverlayOpen, activeSlug, activeType, indexSection, contentMap, creatorMap, tagMap]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.history.state?.overlay) {
            const cleanState = { ...window.history.state };
            delete cleanState.overlay;
            delete cleanState.slug;
            delete cleanState.type;
            window.history.replaceState(cleanState, '', window.location.href);
        }
    }, []);

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
                if (!creator || !creator.contentLoaded) {
                    const id = creator && (creator.prismaUserId || creator._id);
                    if (id) fetchCreatorContent(activeSlug, id);
                    else fetchCreatorByUsername(activeSlug);
                }
                pageview(`/creators/${activeSlug}`);
            } else if (activeType === 'tags') {
                // Always fetch to ensure items are up to date
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
        if (isOverlayOpen && overlayRef.current) {
            overlayRef.current.scrollTop = 0;
        }
    }, [activeSlug, activeType, indexSection, isOverlayOpen]);

    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const mainFooter = document.querySelector('body > footer') as HTMLElement; 

        if (isOverlayOpen) {
            const rafId = requestAnimationFrame(() => {
                const scrollbarWidth = window.innerWidth - html.clientWidth;
                // STOP Main Lenis
                if (mainLenis) mainLenis.stop();
                
                body.style.paddingRight = `${scrollbarWidth}px`; 
                html.style.overflow = 'hidden';
                body.style.overflow = 'hidden';
                if (mainFooter) mainFooter.style.display = 'none';
                if (overlayRef.current) {
                    setOverlayScrollRef(overlayRef.current);
                    overlayRef.current.scrollTop = 0;
                }
            });
            return () => cancelAnimationFrame(rafId);
        } else {
            body.style.paddingRight = '';
            html.style.overflow = '';
            body.style.overflow = '';
            if (mainFooter) mainFooter.style.display = '';
            requestAnimationFrame(() => {
                // START Main Lenis
                if (mainLenis) {
                    mainLenis.start();
                    if (savedScrollPosition > 0) {
                        mainLenis.scrollTo(savedScrollPosition, { immediate: true, force: true, lock: false });
                    }
                } else {
                    if (savedScrollPosition > 0) {
                        window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
                    }
                }
            });
            setOverlayScrollRef(null);
        }
    }, [isOverlayOpen, savedScrollPosition, mainLenis, setOverlayScrollRef]);

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
                case 'releases': paddingTop = 'calc(var(--nav-height-scrolled) + 4rem)'; content = <ReleasePageClient releases={activeIndexData.releases} />; break;
            }
            return { content, paddingTop };
        } 
        
        if (activeType === 'creators') {
            if (activeCreator) {
                const isLoading = !activeCreator.contentLoaded;
                return {
                    content: <CreatorHubClient creatorName={activeCreator.name} username={activeCreator.username} image={activeCreator.image} bio={activeCreator.bio} items={activeCreator.linkedContent || []} scrollContainerRef={overlayRef} isLoading={isLoading} />,
                    paddingTop: '0'
                };
            }
            return { content: <CreatorHubClient creatorName={activeSlug!} username={activeSlug!} items={[]} scrollContainerRef={overlayRef} isLoading={true} />, paddingTop: '0' };
        } 
        
        if (activeType === 'tags') {
            if (activeTag) {
                const isLoading = !activeTag.contentLoaded;
                 return {
                    content: <HubPageClient initialItems={activeTag.items || []} hubTitle={activeTag.title} hubType="وسم" scrollContainerRef={overlayRef} isLoading={isLoading} />,
                    paddingTop: '0'
                 };
            }
             return {
                content: <HubPageClient initialItems={[]} hubTitle={activeSlug || '...'} hubType="وسم" scrollContainerRef={overlayRef} isLoading={true} />,
                paddingTop: '0'
             };
        } 
        
        if (activeItem) {
             if (activeType === 'releases' || (activeType as string) === 'games') {
                const layoutPrefix = sourceLayoutId || undefined;
                return {
                    content: <GameHubClient gameTitle={activeItem.title} items={activeItem.linkedContent || []} synopsis={activeItem.synopsis} releaseTags={activeItem.tags || []} mainImage={activeItem.mainImage} price={activeItem.price} developer={activeItem.developer?.title} publisher={activeItem.publisher?.title} platforms={activeItem.platforms} onGamePass={activeItem.onGamePass} onPSPlus={activeItem.onPSPlus} forcedLayoutIdPrefix={layoutPrefix} scrollContainerRef={overlayRef} />,
                    paddingTop: '0'
                };
             } else {
                 const layoutPrefix = sourceLayoutId || undefined;
                 return {
                    content: (
                        <ContentPageClient key={activeSlug} item={activeItem} type={activeType as any} colorDictionary={colorDictionary} forcedLayoutIdPrefix={layoutPrefix} initialImageSrc={activeImageSrc || undefined} scrollContainerRef={overlayRef}> 
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
                    style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        /* FIX: Set z-index to 2050 to sit above Search (2040) but below Navbar (2100) */
                        zIndex: 2050,
                        transform: 'translateZ(0)',
                        pointerEvents: 'auto'
                    }}
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

export default function KineticOverlayManager(props: { colorDictionary: any[] }) {
    return (
        <Suspense fallback={null}>
            <KineticOverlayManagerContent {...props} />
        </Suspense>
    );
}