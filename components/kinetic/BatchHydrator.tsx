// components/kinetic/BatchHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { batchFetchFullContentAction, batchFetchTagsAction } from '@/app/actions/batchActions';

export default function BatchHydrator({ items }: { items: any[] }) {
    const { hydrateContent, hydrateTags, tagMap } = useContentStore();
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || !items || items.length === 0) return;
        hasHydrated.current = true;

        // 1. Extract Document IDs
        const ids = items.map((item) => item._id || item.id).filter(Boolean);
        
        // 2. Extract Tag Slugs (Unique)
        const tagSlugs = new Set<string>();
        items.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach((t: any) => {
                    if (t.slug) {
                        const s = typeof t.slug === 'string' ? t.slug : t.slug.current;
                        if (s && !tagMap.has(s)) { // Only fetch if not already in store
                             tagSlugs.add(s);
                        }
                    }
                });
            }
            // Check category if it exists and behaves like a tag (News/Articles)
            if (item.category && item.category.slug) {
                const s = typeof item.category.slug === 'string' ? item.category.slug : item.category.slug.current;
                if (s && !tagMap.has(s)) tagSlugs.add(s);
            }
        });
        
        // Fire requests in parallel if needed
        if (ids.length > 0) {
            batchFetchFullContentAction(ids).then((fullDocs) => {
                hydrateContent(fullDocs);
            });
        }
        
        if (tagSlugs.size > 0) {
            batchFetchTagsAction(Array.from(tagSlugs)).then((tagsData) => {
                hydrateTags(tagsData);
            });
        }

    }, [items, hydrateContent, hydrateTags, tagMap]);

    return null;
}