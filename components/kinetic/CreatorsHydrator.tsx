// components/kinetic/CreatorsHydrator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';

/**
 * Ensures creator data is in the store for hydration.
 * This is useful for lists of creators on the homepage or about page.
 */
export default function CreatorsHydrator({ creators }: { creators: any[] }) {
    const { hydrateCreators } = useContentStore();
    const hasHydrated = useRef(false);

    useEffect(() => {
        if (hasHydrated.current || !creators || creators.length === 0) return;
        hasHydrated.current = true;
        hydrateCreators(creators);
    }, [creators, hydrateCreators]);

    return null;
}