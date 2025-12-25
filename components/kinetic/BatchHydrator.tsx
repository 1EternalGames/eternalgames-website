// components/kinetic/BatchHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { batchFetchFullContentAction } from '@/app/actions/batchActions';

export default function BatchHydrator({ items }: { items: any[] }) {
    const hydrateContent = useContentStore((state) => state.hydrateContent);
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || !items || items.length === 0) return;
        hasHydrated.current = true;

        // Extract IDs securely
        const ids = items.map((item) => item._id || item.id).filter(Boolean);
        
        // Don't waste a cycle if no IDs
        if (ids.length === 0) return;

        // console.log(`[Kinetic] Starting hydration for ${ids.length} items...`);

        // Fire and forget - don't block the UI
        batchFetchFullContentAction(ids).then((fullDocs) => {
            // console.log(`[Kinetic] Hydration complete. Received ${fullDocs.length} full documents.`);
            hydrateContent(fullDocs);
        });
    }, [items, hydrateContent]);

    return null;
}