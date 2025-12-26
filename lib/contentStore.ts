// lib/contentStore.ts
import { create } from 'zustand';
import { client } from '@/lib/sanity.client';
import { allContentByGameListQuery, allContentByCreatorListQuery, allContentByTagListQuery } from '@/lib/sanity.queries'; 
import { enrichContentList } from '@/lib/enrichment'; 

export interface KineticContentState {
  contentMap: Map<string, any>;
  pageMap: Map<string, any>;
  creatorMap: Map<string, any>;
  tagMap: Map<string, any>; // ADDED
  
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | 'index' | 'games' | 'creators' | 'tags' | null; // ADDED 'tags'
  indexSection: 'reviews' | 'articles' | 'news' | 'releases' | null;
  
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  previousPath: string | null;
  
  hydrateContent: (items: any[]) => void;
  hydrateIndex: (section: string, data: any) => void;
  hydrateCreators: (creators: any[]) => void;
  hydrateTags: (tags: any[]) => void; // ADDED
  
  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators' | 'tags', layoutId?: string, imageSrc?: string, overrideUrl?: string) => void; // UPDATED
  openIndexOverlay: (section: 'reviews' | 'articles' | 'news' | 'releases') => void;
  
  navigateInternal: (slug: string, type: string) => void;
  closeOverlay: () => void;
  fetchLinkedContent: (slug: string) => Promise<void>;
  fetchCreatorContent: (slug: string, creatorId: string) => Promise<void>;
  fetchTagContent: (slug: string) => Promise<void>; // ADDED
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  pageMap: new Map(),
  creatorMap: new Map(),
  tagMap: new Map(), // ADDED
  
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
          const primaryKey = c.username || c._id;
          const existing = newMap.get(primaryKey);
          
          let merged = c;
          if (existing) {
              merged = { ...c, ...existing };
              if (existing.contentLoaded) {
                  merged.contentLoaded = true;
                  merged.linkedContent = existing.linkedContent;
              }
          }

          if (merged.username) newMap.set(merged.username, merged);
          if (merged._id) newMap.set(merged._id, merged);
          if (merged.prismaUserId) newMap.set(merged.prismaUserId, merged);
      });
      set({ creatorMap: newMap });
  },

  hydrateTags: (tags) => { // ADDED
      const newMap = new Map(get().tagMap);
      tags.forEach(t => {
          if (t.slug) {
              const existing = newMap.get(t.slug);
              // Merge if exists to preserve contentLoaded status if relevant
              const merged = existing ? { ...t, ...existing } : { ...t, contentLoaded: true }; 
              newMap.set(t.slug, merged);
          }
      });
      set({ tagMap: newMap });
  },

  openOverlay: (slug, type, layoutId, imageSrc, overrideUrl) => {
    const currentState = get();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    // Determine target URL based on type
    let targetUrl = overrideUrl;
    if (!targetUrl) {
        if (type === 'creators') targetUrl = `/creators/${slug}`;
        else if (type === 'tags') targetUrl = `/tags/${slug}`;
        else targetUrl = `/${type}/${slug}`;
    }
    
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
      
      if (item && item.contentLoaded) return;

      try {
          const rawLinked = await client.fetch(allContentByGameListQuery, { slug });
          const enrichedLinked = await enrichContentList(rawLinked);
          const updatedItem = { ...item, linkedContent: enrichedLinked, contentLoaded: true };
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
      
      if (creator && creator.contentLoaded) return;

      try {
           const rawContent = await client.fetch(allContentByCreatorListQuery, { creatorIds: [creatorId] });
           const enrichedContent = await enrichContentList(rawContent);
           
           const updatedCreator = { ...creator, linkedContent: enrichedContent, contentLoaded: true };
           const newMap = new Map(creatorMap);
           
           if (updatedCreator.username) newMap.set(updatedCreator.username, updatedCreator);
           if (updatedCreator._id) newMap.set(updatedCreator._id, updatedCreator);
           if (updatedCreator.prismaUserId) newMap.set(updatedCreator.prismaUserId, updatedCreator);
           
           set({ creatorMap: newMap });
      } catch (e) {
          console.error("Failed to fetch creator content", e);
      }
  },

  fetchTagContent: async (slug: string) => { // ADDED
      const { tagMap } = get();
      const tag = tagMap.get(slug);

      if (tag && tag.contentLoaded) return;

      try {
          // This query fetches items where tags[]->slug.current contains $slug OR category->slug.current == $slug
          const rawContent = await client.fetch(allContentByTagListQuery, { slug });
          const enrichedContent = await enrichContentList(rawContent);

          const updatedTag = { ...tag, items: enrichedContent, contentLoaded: true };
          const newMap = new Map(tagMap);
          newMap.set(slug, updatedTag);
          set({ tagMap: newMap });
      } catch (e) {
          console.error("Failed to fetch tag content", e);
      }
  }
}));