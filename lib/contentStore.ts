// lib/contentStore.ts
import { create } from 'zustand';
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery } from '@/lib/sanity.queries';

export interface KineticContentState {
  contentMap: Map<string, any>;
  pageMap: Map<string, any>;
  
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | 'index' | null;
  indexSection: 'reviews' | 'articles' | 'news' | 'releases' | null;
  
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  // NEW: Track where we came from
  previousPath: string | null;
  
  hydrateContent: (items: any[]) => void;
  hydrateIndex: (section: string, data: any) => void;
  
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases', layoutId?: string, imageSrc?: string, overrideUrl?: string) => void;
  openIndexOverlay: (section: 'reviews' | 'articles' | 'news' | 'releases') => void;
  
  navigateInternal: (slug: string, type: string) => void;
  closeOverlay: () => void;
  fetchLinkedContent: (slug: string) => Promise<void>;
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  pageMap: new Map(),
  
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

  openOverlay: (slug, type, layoutId, imageSrc, overrideUrl) => {
    const currentState = get();
    // Capture current path before changing it
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    const targetUrl = overrideUrl || `/${type}/${slug}`;
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
          // Do NOT update previousPath here, we are navigating within the overlay stack
      });
  },

  closeOverlay: () => {
    const { previousPath } = get();
    
    // Restore URL instantly using replaceState
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
          const updatedItem = { ...item, linkedContent: rawLinked };
          const newMap = new Map(contentMap);
          newMap.set(slug, updatedItem);
          set({ contentMap: newMap });
      } catch (e) {
          console.error("Failed to fetch linked content", e);
      }
  }
}));