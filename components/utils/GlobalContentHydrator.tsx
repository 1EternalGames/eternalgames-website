// components/utils/GlobalContentHydrator.tsx
'use client';

import { useEffect } from 'react';
import { useContentStore } from '@/lib/contentStore';

// Invisible component that runs ONCE on the homepage to dump data into the store
export default function GlobalContentHydrator({ items }: { items: any[] }) {
    const hydrate = useContentStore((state) => state.hydrate);

    useEffect(() => {
        if (items && items.length > 0) {
            hydrate(items);
        }
    }, [items, hydrate]);

    return null;
}