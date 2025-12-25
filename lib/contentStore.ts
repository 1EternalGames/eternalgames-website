// lib/contentStore.ts
import { create } from 'zustand';

export interface KineticContentState {
  contentMap: Map<string, any>;
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | null;
  sourceLayoutId: string | null;
  savedScrollPosition: number;
  
  hydrateContent: (items: any[]) => void;
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases', layoutId?: string) => void;
  closeOverlay: () => void;
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  isOverlayOpen: false,
  activeSlug: null,
  activeType: null,
  sourceLayoutId: null,
  savedScrollPosition: 0,

  hydrateContent: (items) => {
    const newMap = new Map(get().contentMap);
    items.forEach(item => {
      // Normalize slug to string for the key
      let slugStr = '';
      if (typeof item.slug === 'string') slugStr = item.slug;
      else if (item.slug?.current) slugStr = item.slug.current;
      
      if (slugStr) {
           newMap.set(slugStr, item);
      }
    });
    set({ contentMap: newMap });
  },

  openOverlay: (slug, type, layoutId) => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    
    if (typeof window !== 'undefined') {
        window.history.pushState({ overlay: true, slug, type }, '', `/${type}/${slug}`);
    }

    set({ 
        isOverlayOpen: true, 
        activeSlug: slug, 
        activeType: type,
        sourceLayoutId: layoutId || null,
        savedScrollPosition: scrollY
    });
  },

  closeOverlay: () => {
    set({ 
        isOverlayOpen: false, 
        activeSlug: null, 
        activeType: null,
        sourceLayoutId: null
    });
  }
}));