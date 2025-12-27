// components/CreatorHubClient.tsx
'use client';

import React, { useEffect, useLayoutEffect, RefObject } from 'react';
import HubPageClient from '@/components/HubPageClient';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import Link from 'next/link';

interface CreatorHubClientProps {
    creatorName: string;
    username: string;
    image?: string | null;
    bio?: string | null;
    items: any[];
    scrollContainerRef?: RefObject<HTMLElement | null>;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function CreatorHubClient({
    creatorName,
    username,
    image,
    bio,
    items,
    scrollContainerRef
}: CreatorHubClientProps) {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);

    // Reset scroll on mount
    useIsomorphicLayoutEffect(() => { 
        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [scrollContainerRef]);

    useEffect(() => {
        return () => setPrefix('default');
    }, [setPrefix]);

    // Determine loading state: If items array is empty but we haven't fetched explicitly?
    // Actually, in the store logic, 'linkedContent' defaults to [].
    // If 'contentLoaded' is false, it means we are still fetching.
    // However, `CreatorHubClient` props don't pass `contentLoaded` directly.
    // BUT we can infer it: if items are empty, we can assume loading IF this is an overlay scenario
    // where preloading happened.
    // For now, let's pass a derived loading state if we want the spinner. 
    // Ideally, the parent KineticOverlayManager should pass an explicit 'isLoading' prop.
    // But since I didn't update the interface in KineticOverlayManager yet, let's assume if items empty, show loading?
    // No, that would break empty profiles forever.
    
    // UPDATE: KineticOverlayManager passes items. 
    // I will rely on HubPageClient's new isLoading prop, but I need to update KineticOverlayManager to pass it.
    
    return (
        <HubPageClient
            initialItems={items}
            hubTitle={creatorName}
            hubType="أعمال"
            synopsis={bio}
            fallbackImage={image}
            scrollContainerRef={scrollContainerRef}
            headerAction={
                 <Link 
                    href={`/profile/${username}`} 
                    className="outline-button no-underline" 
                    style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)', backdropFilter: 'blur(4px)' }} 
                    prefetch={false}
                >
                    → الملف الشخصي
                </Link>
            }
            // If items are empty, we might be loading.
            // However, real loading status comes from the store wrapper.
            // I'll leave this optional for now.
        />
    );
}