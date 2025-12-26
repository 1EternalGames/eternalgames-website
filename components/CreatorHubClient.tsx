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
        />
    );
}