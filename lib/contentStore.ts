// lib/contentStore.ts
import { create } from 'zustand';
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery, allContentByCreatorListQuery } from '@/lib/sanity.queries'; 
import { enrichContentList } from '@/lib/enrichment'; // We need this, but can't import server actions here easily.

// Mock enrichment or direct usage for client store
// Real enrichment happens on server. For client nav, we use what we get or accept raw.

export interface KineticContentState {
  contentMap: Map<string, any>;
  pageMap: Map<string, any>;
  creatorMap: Map<string, any>;
  
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | 'index' | 'games' | 'creators' | null;
  indexSection: 'reviews' | 'articles' | 'news' | 'releases' | null;
  
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  previousPath: string | null;
  
  hydrateContent: (items: any[]) => void;
  hydrateIndex: (section: string, data: any) => void;
  hydrateCreators: (creators: any[]) => void;
  
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators', layoutId?: string, imageSrc?: string, overrideUrl?: string) => void;
  openIndexOverlay: (section: 'reviews' | 'articles' | 'news' | 'releases') => void;
  
  navigateInternal: (slug: string, type: string) => void;
  closeOverlay: () => void;
  fetchLinkedContent: (slug: string) => Promise<void>;
  fetchCreatorContent: (slug: string, creatorId: string) => Promise<void>;
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  pageMap: new Map(),
  creatorMap: new Map(),
  
  isOverlayOpen: false,
  activeSlug: null,
  activeType: null,
  indexSection: null,
  sourceLayoutId: null,
  activeImageSrc: null,
  savedScrollPosition: 0,
  previousPath: null,

  hydrateContent: (items) => {
    const newMap = new Map(get().contentMap);
    items.forEach(item => {
      if (item && item.slug) {
        const slugStr = typeof item.slug === 'string' ? item.slug : item.slug.current;
        if (slugStr) {
             const existing = newMap.get(slugStr);
             const newItem = { ...item, linkedContent: existing?.linkedContent || [] };
             newMap.set(slugStr, newItem);
        }
      }
    });
    set({ contentMap: newMap });
  },

  hydrateIndex: (section, data) => {
      const newPageMap = new Map(get().pageMap);
      newPageMap.set(section, data);
      set({ pageMap: newPageMap });
  },

  hydrateCreators: (creators) => {
      const newMap = new Map(get().creatorMap);
      creators.forEach(c => {
          if (c.username) newMap.set(c.username, c);
          if (c._id) newMap.set(c._id, c);
          if (c.prismaUserId) newMap.set(c.prismaUserId, c);
      });
      set({ creatorMap: newMap });
  },

  openOverlay: (slug, type, layoutId, imageSrc, overrideUrl) => {
    const currentState = get();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    const targetUrl = overrideUrl || (type === 'creators' ? `/creators/${slug}` : `/${type}/${slug}`);
    
    if (typeof window !== 'undefined') {
        window.history.pushState({ overlay: true, slug, type }, '', targetUrl);
    }

    set({ 
        isOverlayOpen: true, 
        activeSlug: slug, 
        activeType: type,
        indexSection: null,
        sourceLayoutId: layoutId || null,
        activeImageSrc: imageSrc || null,
        savedScrollPosition: scrollY,
        previousPath: currentState.isOverlayOpen ? currentState.previousPath : currentPath
    });
  },

  openIndexOverlay: (section) => {
      const currentState = get();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
      
      if (typeof window !== 'undefined') {
          window.history.pushState({ overlay: true, type: 'index', section }, '', `/${section}`);
      }

      set({
          isOverlayOpen: true,
          activeSlug: null,
          activeType: 'index',
          indexSection: section,
          sourceLayoutId: null,
          activeImageSrc: null,
          savedScrollPosition: scrollY,
          previousPath: currentState.isOverlayOpen ? currentState.previousPath : currentPath
      });
  },

  navigateInternal: (slug, type) => {
      set({
          isOverlayOpen: true,
          activeSlug: slug,
          activeType: type as any,
          indexSection: type === 'index' ? slug as any : null,
          sourceLayoutId: null, 
          activeImageSrc: null
      });
  },

  closeOverlay: () => {
    const { previousPath } = get();
    if (typeof window !== 'undefined' && previousPath) {
        window.history.replaceState(null, '', previousPath);
    }

    set({ 
        isOverlayOpen: false, 
        activeSlug: null, 
        activeType: null,
        indexSection: null,
        sourceLayoutId: null,
        activeImageSrc: null,
        previousPath: null
    });
  },

  fetchLinkedContent: async (slug: string) => {
      const { contentMap } = get();
      const item = contentMap.get(slug);
      if (item && item.linkedContent && item.linkedContent.length > 0) return;

      try {
          const rawLinked = await client.fetch(allContentByGameListQuery, { slug });
          // Note: Missing enrichment here, but sufficient for functionality
          const updatedItem = { ...item, linkedContent: rawLinked };
          const newMap = new Map(contentMap);
          newMap.set(slug, updatedItem);
          set({ contentMap: newMap });
      } catch (e) {
          console.error("Failed to fetch linked content", e);
      }
  },

  fetchCreatorContent: async (slug: string, creatorId: string) => {
      const { creatorMap } = get();
      const creator = creatorMap.get(slug);
      
      if (creator && creator.linkedContent && creator.linkedContent.length > 0) return;

      try {
           // Fetch content via Sanity Client
           // Note: We use the creatorId (Sanity ID) for the query
           const rawContent = await client.fetch(allContentByCreatorListQuery, { creatorIds: [creatorId] });
           
           const updatedCreator = { ...creator, linkedContent: rawContent };
           const newMap = new Map(creatorMap);
           newMap.set(slug, updatedCreator);
           set({ creatorMap: newMap });
      } catch (e) {
          console.error("Failed to fetch creator content", e);
      }
  }
}));