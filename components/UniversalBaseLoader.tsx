// components/UniversalBaseLoader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useContentStore } from '@/lib/contentStore';
import UniversalBase from '@/components/UniversalBase';
import { usePathname } from 'next/navigation';

export default function UniversalBaseLoader() {
    const { universalData, hydrateUniversal } = useContentStore();
    const [hasMounted, setHasMounted] = useState(false);
    const pathname = usePathname();
    const isHomepage = pathname === '/';

    useEffect(() => {
        setHasMounted(true);

        // If we don't have the data (and we are not on the homepage where it hydrates automatically),
        // we fetch it immediately. 
        // Note: Even if we ARE on the homepage, if for some reason hydration failed or state was cleared,
        // this is a safe fallback. But usually homepage hydrates via UniversalBaseHydrator.
        if (!universalData && !isHomepage) {
            const fetchBackgroundData = async () => {
                try {
                    // Fetch from the API route. Browser will cache this request!
                    // This is much better than a Server Action for large static blobs.
                    const res = await fetch('/api/universal', { 
                        // Force cache usage if available
                        cache: 'force-cache',
                        next: { revalidate: 3600 } 
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        hydrateUniversal(data);
                    }
                } catch (error) {
                    console.error("Background fetch of Universal Data failed:", error);
                }
            };

            // Fetch immediately to ensure overlays work ASAP
            fetchBackgroundData();
        }
    }, [isHomepage, universalData, hydrateUniversal]);

    // Render the base layer if data exists.
    // This runs on EVERY page once data is loaded.
    if (universalData) {
        return <UniversalBase data={universalData} />;
    }

    return null;
}