// components/HomepageHydrator.tsx
'use client';

import { useRef } from 'react';
import { useContentStore } from '@/lib/contentStore';

// This component is used ONLY on the homepage.
// It takes the Server-Side Generated data and immediately hydrates the client store.
// This ensures the homepage loads instantly without needing an API call.
export default function HomepageHydrator({ data }: { data: any }) {
    const hydrated = useRef(false);
    const { hydrateUniversal } = useContentStore();

    if (!hydrated.current) {
        hydrateUniversal(data);
        hydrated.current = true;
    }

    return null; // It renders nothing visual itself; the Layout's Loader will pick up the data.
}