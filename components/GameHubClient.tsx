// components/GameHubClient.tsx
'use client';

import React, { useRef, RefObject } from 'react'; // Added RefObject
import { motion } from 'framer-motion';
import HubPageClient from '@/components/HubPageClient';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useEffect } from 'react';

interface GameHubClientProps {
    gameTitle: string;
    items: any[];
    synopsis?: string | null;
    releaseTags: any[];
    mainImage: any;
    price?: string;
    developer?: string;
    publisher?: string;
    platforms?: string[];
    onGamePass?: boolean;
    onPSPlus?: boolean;
    forcedLayoutIdPrefix?: string;
    scrollContainerRef?: RefObject<HTMLElement | null>; // Added Prop
}

export default function GameHubClient({
    gameTitle,
    items,
    synopsis,
    releaseTags,
    mainImage,
    price,
    developer,
    publisher,
    platforms,
    onGamePass,
    onPSPlus,
    forcedLayoutIdPrefix,
    scrollContainerRef // Destructure
}: GameHubClientProps) {
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);

    useEffect(() => {
        if (forcedLayoutIdPrefix) {
            setPrefix(forcedLayoutIdPrefix);
        }
        return () => setPrefix('default');
    }, [forcedLayoutIdPrefix, setPrefix]);

    return (
        <HubPageClient
            initialItems={items}
            hubTitle={gameTitle}
            hubType="اللعبة"
            synopsis={synopsis}
            tags={releaseTags}
            fallbackImage={mainImage}
            price={price}
            developer={developer}
            publisher={publisher}
            platforms={platforms}
            onGamePass={onGamePass}
            onPSPlus={onPSPlus}
            scrollContainerRef={scrollContainerRef} // Pass down
        />
    );
}