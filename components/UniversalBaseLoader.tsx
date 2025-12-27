// components/UniversalBaseLoader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// OPTIMIZATION: Dynamically import UniversalBase.
// This splits the heavy 3D/Home content into a separate chunk that is NOT loaded
// during the initial render of sub-pages, reducing TBT and build memory usage.
const UniversalBase = dynamic(() => import('@/components/UniversalBase'), {
    ssr: false, // It's a visual background layer, safe to skip SSR
    loading: () => null
});

export default function UniversalBaseLoader() {
    const { universalData, hydrateUniversal } = useContentStore();
    const pathname = usePathname();
    const isHomepage = pathname === '/';
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // If we don't have the data (and we are not on the homepage where it hydrates automatically),
        // we fetch it immediately via the API.
        if (!universalData && !isHomepage) {
            const fetchBackgroundData = async () => {
                try {
                    const res = await fetch('/api/universal', { 
                        cache: 'force-cache',
                        next: { revalidate: 3600 } 
                    });
                    if (res.ok) {
                        const data = await res.json();
                        hydrateUniversal(data);
                    }
                } catch (error) {
                    console.error("Background fetch failed:", error);
                }
            };
            
            // Use requestIdleCallback if available to avoid blocking main thread hydration
            if ('requestIdleCallback' in window) {
                // @ts-ignore
                window.requestIdleCallback(fetchBackgroundData);
            } else {
                setTimeout(fetchBackgroundData, 2000);
            }
        }
    }, [isHomepage, universalData, hydrateUniversal]);

    useEffect(() => {
        if (universalData) {
            setShouldRender(true);
        }
    }, [universalData]);

    if (shouldRender && universalData) {
        return <UniversalBase data={universalData} />;
    }

    return null;
}