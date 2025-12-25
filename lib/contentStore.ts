// lib/contentStore.ts
import { create } from 'zustand';

export interface KineticContentState {
  // Map of slug -> Full Document Data
  contentMap: Map<string, any>;
  
  // Overlay State
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | null;
  
  // Transition State
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  // Actions
  hydrateContent: (items: any[]) => void;
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases', layoutId?: string, imageSrc?: string) => void;
  // New: For back/forward navigation without pushing new history
  navigateInternal: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases') => void;
  closeOverlay: () => void;
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
             newMap.set(slugStr, item);
        }
      }
    });
    set({ contentMap: newMap });
  },

  openOverlay: (slug, type, layoutId, imageSrc) => {
    // 1. Save scroll position only if opening fresh (not navigating within overlay)
    const currentState = get();
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    // 2. Push State to URL
    if (typeof window !== 'undefined') {
        window.history.pushState({ overlay: true, slug, type }, '', `/${type}/${slug}`);
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
      // Updates state without pushing history (for PopState events)
      set({
          isOverlayOpen: true,
          activeSlug: slug,
          activeType: type,
          // Clear transition props on back nav to prevent weird reverse-morphs if IDs don't match perfectly
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
  }
}));