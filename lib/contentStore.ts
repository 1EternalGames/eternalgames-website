// lib/contentStore.ts
import { create } from 'zustand';

// Store all fetched content in a global map
// Key: slug (or id for backup), Value: The full content object
interface ContentStoreState {
    cache: Record<string, any>;
    // Method to hydrate the cache
    hydrate: (items: any[]) => void;
    // Method to retrieve
    getBySlug: (slug: string) => any | undefined;
}

export const useContentStore = create<ContentStoreState>((set, get) => ({
    cache: {},
    hydrate: (items) => {
        set((state) => {
            const newCache = { ...state.cache };
            items.forEach((item) => {
                if (item.slug) {
                    newCache[item.slug] = item;
                }
            });
            return { cache: newCache };
        });
    },
    getBySlug: (slug) => get().cache[slug],
}));