// lib/contentStore.ts
import { create } from 'zustand';
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery } from '@/lib/sanity.queries';
import { enrichContentList } from '@/lib/enrichment';
// NOTE: We cannot use server actions directly in Zustand easily without wrapping. 
// We will use the client-side Sanity fetch here for the lazy-load of linked content.
// Since 'client' is configured with useCdn: true, this is performant.

export interface KineticContentState {
  contentMap: Map<string, any>;
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | null;
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  hydrateContent: (items: any[]) => void;
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases', layoutId?: string, imageSrc?: string, overrideUrl?: string) => void;
  navigateInternal: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases') => void;
  closeOverlay: () => void;
  fetchLinkedContent: (slug: string) => Promise<void>;
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  isOverlayOpen: false,
  activeSlug: null,
  activeType: null,
  sourceLayoutId: null,
  activeImageSrc: null,
  savedScrollPosition: 0,

  hydrateContent: (items) => {
    const newMap = new Map(get().contentMap);
    items.forEach(item => {
      if (item && item.slug) {
        const slugStr = typeof item.slug === 'string' ? item.slug : item.slug.current;
        if (slugStr) {
             // Preserve existing linkedContent if updating
             const existing = newMap.get(slugStr);
             const newItem = { ...item, linkedContent: existing?.linkedContent || [] };
             newMap.set(slugStr, newItem);
        }
      }
    });
    set({ contentMap: newMap });
  },

  openOverlay: (slug, type, layoutId, imageSrc, overrideUrl) => {
    const currentState = get();
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    const targetUrl = overrideUrl || `/${type}/${slug}`;
    if (typeof window !== 'undefined') {
        window.history.pushState({ overlay: true, slug, type }, '', targetUrl);
    }

    set({ 
        isOverlayOpen: true, 
        activeSlug: slug, 
        activeType: type,
        sourceLayoutId: layoutId || null,
        activeImageSrc: imageSrc || null,
        savedScrollPosition: scrollY
    });
  },

  navigateInternal: (slug, type) => {
      set({
          isOverlayOpen: true,
          activeSlug: slug,
          activeType: type,
          sourceLayoutId: null, 
          activeImageSrc: null
      });
  },

  closeOverlay: () => {
    set({ 
        isOverlayOpen: false, 
        activeSlug: null, 
        activeType: null,
        sourceLayoutId: null,
        activeImageSrc: null
    });
  },

  fetchLinkedContent: async (slug: string) => {
      const { contentMap } = get();
      const item = contentMap.get(slug);
      
      // If already fetched, skip
      if (item && item.linkedContent && item.linkedContent.length > 0) return;

      try {
          // Fetch raw data
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