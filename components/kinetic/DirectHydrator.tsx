// components/kinetic/DirectHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';

/**
 * Hydrates the content store directly with the provided items without triggering a network request.
 * Ideal for content types like Game Releases where the list view already contains the full dataset needed for the overlay.
 */
export default function DirectHydrator({ items }: { items: any[] }) {
    const hydrateContent = useContentStore((state) => state.hydrateContent);
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || !items || items.length === 0) return;
        hasHydrated.current = true;

        // console.log(`[DirectHydrator] Hydrating ${items.length} items directly to store.`);
        hydrateContent(items);
    }, [items, hydrateContent]);

    return null;
}