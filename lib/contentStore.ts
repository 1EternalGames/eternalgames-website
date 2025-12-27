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
  universalData: any | null; // NEW: Store the full raw universal object
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
  
  hydrateUniversal: (data: any) => void;
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
  universalData: null, // Initial state
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

  hydrateUniversal: (data) => {
      // 0. Store the raw data for the Loader to use
      set({ universalData: data });

      const { hydrateContent, hydrateIndex, hydrateCreators, hydrateTags } = get();
      
      const hubContent: any[] = [];
      
      if (data.hubs) {
          if (data.hubs.games) data.hubs.games.forEach((g: any) => g.linkedContent && hubContent.push(...g.linkedContent));
          if (data.hubs.tags) data.hubs.tags.forEach((t: any) => t.items && hubContent.push(...t.items));
          if (data.hubs.creators) data.hubs.creators.forEach((c: any) => c.linkedContent && hubContent.push(...c.linkedContent));
      }

      const allContent = [
          ...(data.reviews || []), 
          ...(data.articles || []), 
          ...(data.news || []), 
          ...(data.releases || []),
          ...hubContent
      ];

      const processedContent = allContent.map(item => {
          const hasBody = item.content && Array.isArray(item.content) && item.content.length > 0;
          const hasHub = item.linkedContent && Array.isArray(item.linkedContent);
          
          return {
              ...item,
              contentLoaded: hasBody || hasHub
          };
      });
      
      hydrateContent(processedContent);
      
      if (data.reviews) {
          hydrateIndex('reviews', {
              hero: data.reviews[0],
              grid: data.reviews,
              allGames: data.metadata?.games || [],
              allTags: data.metadata?.gameTags || [],
              nextOffset: data.reviews.length
          });
      }
      
      if (data.articles) {
          hydrateIndex('articles', {
              featured: data.articles.slice(0, 5),
              grid: data.articles,
              allGames: data.metadata?.games || [],
              allGameTags: data.metadata?.gameTags || [],
              allArticleTypeTags: data.metadata?.articleTags || [],
              nextOffset: data.articles.length
          });
      }
      
      if (data.news) {
          hydrateIndex('news', {
              hero: data.news.slice(0, 4),
              grid: data.news,
              allGames: data.metadata?.games || [],
              allTags: data.metadata?.newsTags || [],
              nextOffset: data.news.length
          });
      }
      
      if (data.releases) {
          hydrateIndex('releases', {
              releases: data.releases
          });
      }
      
      if (data.hubs) {
          if (data.hubs.games) hydrateContent(data.hubs.games.map((g: any) => ({ ...g, contentLoaded: true })));
          if (data.hubs.tags) hydrateTags(data.hubs.tags.map((t: any) => ({ ...t, contentLoaded: true })));
          if (data.hubs.creators) hydrateCreators(data.hubs.creators.map((c: any) => ({ ...c, contentLoaded: true })));
      }

      hydrateCreators(data.credits || []);
  },

  hydrateContent: (items) => {
    const newMap = new Map(get().contentMap);
    items.forEach(item => {
      if (item && item.slug) {
        const slugStr = typeof item.slug === 'string' ? item.slug : item.slug.current;
        if (slugStr) {
             const existing = newMap.get(slugStr);
             let isLoaded = false;
             if (item.contentLoaded === true) { isLoaded = true; } 
             else {
                 const hasBody = item.content && Array.isArray(item.content) && item.content.length > 0;
                 const hasLinked = item.linkedContent && Array.isArray(item.linkedContent);
                 if (hasBody || hasLinked) isLoaded = true;
                 else if (existing?.contentLoaded) isLoaded = true;
             }

             const content = (item.content && item.content.length > 0) ? item.content : existing?.content;
             const linkedContent = (item.linkedContent && item.linkedContent.length > 0) ? item.linkedContent : existing?.linkedContent;
             const tiptapContent = item.tiptapContent || existing?.tiptapContent;

             const newItem = { 
                 ...existing, 
                 ...item,
                 content,
                 linkedContent,
                 tiptapContent,
                 contentLoaded: isLoaded
             };

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
          const updatedData = { ...currentData, grid: [...currentGrid, ...newItems], nextOffset: nextOffset };
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
          for (const key of keys) { if (newMap.has(key)) { existing = newMap.get(key); break; } }

          let merged = { ...c };
          if (c.linkedContent !== undefined) merged.contentLoaded = true;
          if (c.contentLoaded) merged.contentLoaded = true;

          if (existing) {
              merged = { ...existing, ...c };
              if (c.linkedContent !== undefined) { merged.linkedContent = c.linkedContent; merged.contentLoaded = true; }
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
              const slugStr = typeof t.slug === 'string' ? t.slug : t.slug.current;
              if (slugStr) {
                  const existing = newMap.get(slugStr);
                  const merged = existing ? { ...t, ...existing } : { ...t };
                  if (t.items !== undefined) { merged.items = t.items; merged.contentLoaded = true; }
                  if (t.contentLoaded) merged.contentLoaded = true;
                  newMap.set(slugStr, merged);
              }
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
            const partialCreator = { username: slug, name: preloadedData.name, image: preloadedData.image, contentLoaded: false };
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
    
    if (typeof window !== 'undefined') window.history.pushState({ overlay: true, slug, type }, '', targetUrl);

    set({ 
        isOverlayOpen: true, activeSlug: slug, activeType: type, indexSection: null,
        sourceLayoutId: layoutId || null, activeImageSrc: imageSrc || null, savedScrollPosition: scrollY,
        previousPath: currentState.isOverlayOpen ? currentState.previousPath : currentPath
    });
  },

  openIndexOverlay: (section) => {
      const currentState = get();
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const scrollY = !currentState.isOverlayOpen && typeof window !== 'undefined' ? window.scrollY : currentState.savedScrollPosition;
      if (typeof window !== 'undefined') window.history.pushState({ overlay: true, type: 'index', section }, '', `/${section}`);
      set({
          isOverlayOpen: true, activeSlug: null, activeType: 'index', indexSection: section,
          sourceLayoutId: null, activeImageSrc: null, savedScrollPosition: scrollY,
          previousPath: currentState.isOverlayOpen ? currentState.previousPath : currentPath
      });
  },

  navigateInternal: (slug, type) => {
      set({
          isOverlayOpen: true, activeSlug: slug, activeType: type as any,
          indexSection: type === 'index' ? slug as any : null,
          sourceLayoutId: null, activeImageSrc: null
      });
  },

  closeOverlay: () => {
    const { previousPath } = get();
    if (typeof window !== 'undefined' && previousPath) {
        window.history.replaceState(null, '', previousPath);
    }
    set({ isOverlayOpen: false, activeSlug: null, activeType: null, indexSection: null, sourceLayoutId: null, activeImageSrc: null, previousPath: null });
  },

  forceCloseOverlay: () => {
      set({ isOverlayOpen: false, activeSlug: null, activeType: null, indexSection: null, sourceLayoutId: null, activeImageSrc: null, previousPath: null });
  },

  fetchLinkedContent: async (slug: string) => {
      const { contentMap } = get();
      const item = contentMap.get(slug);
      if (item && item.contentLoaded) return;
      try {
          const linkedContent = await fetchGameContentAction(slug);
          const updatedItem = { ...item, linkedContent, contentLoaded: true };
          const newMap = new Map(contentMap);
          newMap.set(slug, updatedItem);
          set({ contentMap: newMap });
      } catch (e) { console.error("Failed to fetch linked content", e); }
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
      } catch (e) { console.error("Failed to fetch creator content", e); }
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
      } catch (e) { console.error("Failed to fetch tag content", e); }
  },

  fetchFullContent: async (slug: string) => {
      const { contentMap } = get();
      const item = contentMap.get(slug);
      if (item && item.contentLoaded) return; 
      
      try {
          const fullItem = await fetchSingleContentAction(slug);
          if (fullItem) {
               const newMap = new Map(contentMap);
               // IMPORTANT: Mark as contentLoaded here too
               newMap.set(slug, { ...item, ...fullItem, contentLoaded: true });
               set({ contentMap: newMap });
          }
      } catch (e) { console.error("Failed to fetch full content", e); }
  },

  fetchCreatorByUsername: async (username: string) => {
      const { creatorMap, hydrateCreators } = get();
      if (creatorMap.has(username) && creatorMap.get(username).contentLoaded) return;
      try {
          const creatorData = await fetchCreatorByUsernameAction(username);
          if (creatorData) { hydrateCreators([creatorData]); }
      } catch (e) { console.error("Failed to fetch creator by username", e); }
  },
}));