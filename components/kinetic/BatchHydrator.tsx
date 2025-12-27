// components/kinetic/BatchHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { 
    batchFetchFullContentAction, 
    batchFetchTagsAction,
    batchFetchCreatorsAction // NEW
} from '@/app/actions/batchActions';

export default function BatchHydrator({ items }: { items: any[] }) {
    const { hydrateContent, hydrateTags, hydrateCreators, tagMap, creatorMap } = useContentStore();
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || !items || items.length === 0) return;
        hasHydrated.current = true;

        // 1. Extract IDs for full content body fetch
        const ids = items.map((item) => item._id || item.id).filter(Boolean);
        
        // 2. Extract Tag Slugs (Unique)
        const tagSlugs = new Set<string>();
        
        // 3. Extract Creator IDs (Unique)
        const creatorIds = new Set<string>();

        items.forEach(item => {
            // Tags
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach((t: any) => {
                    if (t.slug) {
                        const s = typeof t.slug === 'string' ? t.slug : t.slug.current;
                        if (s && !tagMap.has(s)) tagSlugs.add(s);
                    }
                });
            }
            // Categories (treated as tags)
            if (item.category && item.category.slug) {
                const s = typeof item.category.slug === 'string' ? item.category.slug : item.category.slug.current;
                if (s && !tagMap.has(s)) tagSlugs.add(s);
            }

            // Creators (Authors, Reporters, Designers)
            const creators = [...(item.authors || []), ...(item.reporters || []), ...(item.designers || [])];
            creators.forEach((c: any) => {
                // We prioritize prismaUserId for lookups if available, otherwise _id
                const id = c.prismaUserId || c._id;
                const username = c.username;
                
                // If we don't have this creator loaded in the store OR we have them but no content yet
                // The store check creatorMap.has(username) is safer.
                const needsFetch = username ? !creatorMap.has(username) : !creatorMap.has(id);
                
                if (id && needsFetch) {
                    creatorIds.add(id);
                }
            });
        });
        
        // Fire requests in parallel
        
        // A. Full Content Bodies
        if (ids.length > 0) {
            batchFetchFullContentAction(ids).then((fullDocs) => {
                hydrateContent(fullDocs);
            });
        }
        
        // B. Tag Hub Data
        if (tagSlugs.size > 0) {
            batchFetchTagsAction(Array.from(tagSlugs)).then((tagsData) => {
                hydrateTags(tagsData);
            });
        }

        // C. Creator Hub Data
        if (creatorIds.size > 0) {
            batchFetchCreatorsAction(Array.from(creatorIds)).then((creatorsData) => {
                hydrateCreators(creatorsData);
            });
        }

    }, [items, hydrateContent, hydrateTags, hydrateCreators, tagMap, creatorMap]);

    return null;
}