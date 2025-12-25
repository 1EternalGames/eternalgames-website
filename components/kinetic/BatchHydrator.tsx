// components/kinetic/BatchHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { batchFetchFullContentAction } from '@/app/actions/batchActions';

export default function BatchHydrator({ items }: { items: any[] }) {
    const hydrateContent = useContentStore((state) => state.hydrateContent);
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || items.length === 0) return;
        hasHydrated.current = true;

        const ids = items.map((item) => item._id || item.id).filter(Boolean);

        // Fire and forget - don't block the UI
        batchFetchFullContentAction(ids).then((fullDocs) => {
            // console.log(`[Kinetic] Hydrated ${fullDocs.length} items into Data Lake`);
            hydrateContent(fullDocs);
        });
    }, [items, hydrateContent]);

    return null;
}