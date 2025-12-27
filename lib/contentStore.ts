// lib/contentStore.ts
import { create } from 'zustand';
import { 
    fetchGameContentAction, 
    fetchCreatorContentAction, 
    fetchTagContentAction,
    fetchSingleContentAction,
    fetchCreatorByUsernameAction
} from '@/app/actions/batchActions';

export interface KineticContentState {
  contentMap: Map<string, any>;
  pageMap: Map<string, any>;
  creatorMap: Map<string, any>;
  tagMap: Map<string, any>;
  
  isOverlayOpen: boolean;
  activeSlug: string | null;
  activeType: 'reviews' | 'articles' | 'news' | 'releases' | 'index' | 'games' | 'creators' | 'tags' | null;
  indexSection: 'reviews' | 'articles' | 'news' | 'releases' | null;
  
  sourceLayoutId: string | null;
  activeImageSrc: string | null;
  savedScrollPosition: number;
  
  previousPath: string | null;
  
  hydrateContent: (items: any[]) => void;
  hydrateIndex: (section: string, data: any) => void;
  hydrateCreators: (creators: any[]) => void;
  hydrateTags: (tags: any[]) => void;
  
  appendToSection: (section: 'reviews' | 'articles' | 'news', newItems: any[], nextOffset: number | null) => void;

  openOverlay: (slug: string, type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators' | 'tags', layoutId?: string, imageSrc?: string, overrideUrl?: string, preloadedData?: any) => void;
  openIndexOverlay: (section: 'reviews' | 'articles' | 'news' | 'releases') => void;
  
  navigateInternal: (slug: string, type: string) => void;
  closeOverlay: () => void;
  forceCloseOverlay: () => void;
  fetchLinkedContent: (slug: string) => Promise<void>;
  fetchCreatorContent: (slug: string, creatorId: string) => Promise<void>;
  fetchTagContent: (slug: string) => Promise<void>;
  fetchFullContent: (slug: string) => Promise<void>;
  fetchCreatorByUsername: (username: string) => Promise<void>;
}

export const useContentStore = create<KineticContentState>((set, get) => ({
  contentMap: new Map(),
  pageMap: new Map(),
  creatorMap: new Map(),
  tagMap: new Map(),
  
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
             
             // --- FIX: ABSOLUTE PRIORITY FOR PRE-FETCHED DATA ---
             // If the incoming item has linkedContent (array), it's a Hub. Mark as loaded.
             // If it has 'contentLoaded: true' explicitly, mark as loaded.
             let isLoaded = item.contentLoaded || false;
             
             if (item.linkedContent && Array.isArray(item.linkedContent)) {
                 isLoaded = true;
             } else if (existing?.contentLoaded) {
                 isLoaded = true;
             }

             // Merge logic: Incoming data overwrites existing metadata, 
             // but we preserve existing loaded content if incoming is just a stub.
             const newItem = { 
                 ...existing, 
                 ...item,
                 contentLoaded: isLoaded
             };
             
             // If existing had content and new one doesn't, keep existing content
             if (existing?.linkedContent && (!item.linkedContent || item.linkedContent.length === 0)) {
                 newItem.linkedContent = existing.linkedContent;
             }

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

  appendToSection: (section, newItems, nextOffset) => {
      const { pageMap } = get();
      const currentData = pageMap.get(section);
      if (currentData) {
          const currentGrid = currentData.grid || [];
          const updatedData = {
              ...currentData,
              grid: [...currentGrid, ...newItems],
              nextOffset: nextOffset
          };
          const newPageMap = new Map(pageMap);
          newPageMap.set(section, updatedData);
          set({ pageMap: newPageMap });
      }
  },

  hydrateCreators: (creators) => {
      const newMap = new Map(get().creatorMap);
      creators.forEach(c => {
          const keys = [];
          if (c.username) keys.push(c.username);
          if (c._id) keys.push(c._id);
          if (c.prismaUserId) keys.push(c.prismaUserId);

          let existing = null;
          for (const key of keys) {
              if (newMap.has(key)) {
                  existing = newMap.get(key);
                  break;
              }
          }

          let merged = { ...c };
          
          if (c.linkedContent !== undefined) {
              merged.contentLoaded = true;
          }

          if (existing) {
              merged = { ...existing, ...c };
              if (c.linkedContent !== undefined) {
                  merged.linkedContent = c.linkedContent;
                  merged.contentLoaded = true;
              }
          }
          
          if (merged.username) newMap.set(merged.username, merged);
          if (merged._id) newMap.set(merged._id, merged);
          if (merged.prismaUserId) newMap.set(merged.prismaUserId, merged);
      });
      set({ creatorMap: newMap });
  },

  hydrateTags: (tags) => {
      const newMap = new Map(get().tagMap);
      tags.forEach(t => {
          if (t.slug) {
              const existing = newMap.get(t.slug);
              const merged = existing ? { ...t, ...existing } : { ...t };
              if (t.items !== undefined) {
                   merged.items = t.items;
                   merged.contentLoaded = true;
              }
              newMap.set(t.slug, merged);
          }
      });
      set({ tagMap: newMap });
  },

  openOverlay: (slug, type, layoutId, imageSrc, overrideUrl, preloadedData) => {
    const currentState = get();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
    
    if (type === 'creators' && preloadedData) {
        const { creatorMap } = currentState;
        const existing = creatorMap.get(slug);
        if (!existing) {
            const newMap = new Map(creatorMap);
            const partialCreator = {
                username: slug,
                name: preloadedData.name,
                image: preloadedData.image,
                contentLoaded: false 
            };
            newMap.set(slug, partialCreator);
            set({ creatorMap: newMap });
        }
    }

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

  forceCloseOverlay: () => {
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
      
      // FIX: Check explicitly for the contentLoaded flag.
      if (item && item.contentLoaded) {
          return;
      }
      
      try {
          const linkedContent = await fetchGameContentAction(slug);
          const updatedItem = { ...item, linkedContent, contentLoaded: true };
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
           const enrichedContent = await fetchCreatorContentAction(creatorId);
           const updatedCreator = { ...creator, linkedContent: enrichedContent, contentLoaded: true };
           const newMap = new Map(creatorMap);
           
           const primaryKey = updatedCreator.username || updatedCreator._id;
           if (primaryKey) newMap.set(primaryKey, updatedCreator);
           if (updatedCreator.username) newMap.set(updatedCreator.username, updatedCreator);
           
           set({ creatorMap: newMap });
      } catch (e) {
          console.error("Failed to fetch creator content", e);
      }
  },

  fetchTagContent: async (slug: string) => {
      const { tagMap } = get();
      const tag = tagMap.get(slug);
      if (tag && tag.contentLoaded) return;
      try {
          const updatedTagData = await fetchTagContentAction(slug);
          if (updatedTagData) {
              const newMap = new Map(tagMap);
              const merged = tag ? { ...tag, ...updatedTagData, contentLoaded: true } : { ...updatedTagData, contentLoaded: true };
              newMap.set(slug, merged);
              set({ tagMap: newMap });
          }
      } catch (e) {
          console.error("Failed to fetch tag content", e);
      }
  },

  fetchFullContent: async (slug: string) => {
      const { contentMap } = get();
      const item = contentMap.get(slug);
      if (item && item.content && Array.isArray(item.content)) return;
      try {
          const fullItem = await fetchSingleContentAction(slug);
          if (fullItem) {
               const newMap = new Map(contentMap);
               newMap.set(slug, { ...item, ...fullItem });
               set({ contentMap: newMap });
          }
      } catch (e) {
          console.error("Failed to fetch full content", e);
      }
  },

  fetchCreatorByUsername: async (username: string) => {
      const { creatorMap, hydrateCreators } = get();
      if (creatorMap.has(username) && creatorMap.get(username).contentLoaded) return;
      try {
          const creatorData = await fetchCreatorByUsernameAction(username);
          if (creatorData) {
              hydrateCreators([creatorData]);
          }
      } catch (e) {
          console.error("Failed to fetch creator by username", e);
      }
  },
}));