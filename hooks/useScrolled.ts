// hooks/useScrolled.ts
'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/uiStore';

export function useScrolled(threshold: number = 50): boolean {
    const [isScrolled, setIsScrolled] = useState(false);
    const { overlayScrollRef } = useUIStore();

    useEffect(() => {
        // Determine which container to listen to
        // If overlayRef is present, use it. Otherwise use window.
        const target = overlayScrollRef || window;
        
        const handleScroll = () => {
            const scrollTop = overlayScrollRef ? overlayScrollRef.scrollTop : window.scrollY;
            setIsScrolled(scrollTop > threshold);
        };

        // Call once to set initial state
        handleScroll();

        // Attach listener
        target.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            target.removeEventListener('scroll', handleScroll);
        };
    }, [threshold, overlayScrollRef]);

    return isScrolled;
}