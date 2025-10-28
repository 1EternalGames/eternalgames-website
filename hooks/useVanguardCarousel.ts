// hooks/useVanguardCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const VANGUARD_SLOTS = 5;
const ANIMATION_COOLDOWN = 450;
const AUTO_NAVIGATE_INTERVAL = 2500;

/**
 * A custom hook to manage the complex state and animation logic for the 
 * 5-card Vanguard carousel.
 * @param itemCount The total number of items in the carousel.
 * @param isCurrentlyInView A boolean indicating if the component is in the viewport.
 */
export function useVanguardCarousel(itemCount: number, isCurrentlyInView: boolean) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true); // <-- NEW STATE
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- NEW EFFECT: Tracks page visibility ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    // --- END NEW EFFECT ---

    const stopInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const startInterval = useCallback(() => {
        stopInterval();
        if (itemCount > 0) {
            intervalRef.current = setInterval(() => {
                setIsNavigating(true);
                setCurrentIndex(prevIndex => (prevIndex + 1) % itemCount);
                setTimeout(() => setIsNavigating(false), ANIMATION_COOLDOWN);
            }, AUTO_NAVIGATE_INTERVAL);
        }
    }, [itemCount, stopInterval]);

    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;
        setIsAnimating(true);
        setIsNavigating(true);
        setCurrentIndex(index);
        startInterval(); 
        setTimeout(() => {
            setIsAnimating(false);
            setIsNavigating(false);
        }, ANIMATION_COOLDOWN);
    }, [isAnimating, currentIndex, startInterval]);

    // --- UPDATED EFFECT: Now includes isPageVisible in its logic ---
    useEffect(() => {
        if (!hoveredId && isCurrentlyInView && isPageVisible) {
            startInterval();
        } else {
            stopInterval();
        }
        return () => stopInterval();
    }, [hoveredId, isCurrentlyInView, isPageVisible, startInterval, stopInterval]);

    const handleSetHoveredId = useCallback((id: string | number | null) => {
        if (isNavigating) return;
        setHoveredId(id);
    }, [isNavigating]);

    const getSlotStyle = useCallback((index: number, itemId: string | number) => {
        const style: any = {
            width: `var(--${index === 2 ? 'center' : 'side'}-width)`,
            height: index === 2 ? '500px' : '350px',
            opacity: 1,
            zIndex: 0
        };
        
        const offset = (isClient && window.innerWidth > 768) ? 250 : 160;
        let transform = '';

        switch (index) {
            case 0: transform = `translateX(${-offset * 1.7}px) scale(0.75)`; break;
            case 1: transform = `translateX(${-offset}px) scale(0.85)`; style.zIndex = 1; break;
            case 2: transform = `translateX(0) scale(1)`; style.zIndex = 2; break;
            case 3: transform = `translateX(${offset}px) scale(0.85)`; style.zIndex = 1; break;
            case 4: transform = `translateX(${offset * 1.7}px) scale(0.75)`; break;
            default: style.opacity = 0;
        }

        if (hoveredId === itemId) {
            style.zIndex = 3;
            transform += ' translateY(-15px)';
        }

        style.transform = transform;
        return style;
    }, [hoveredId, isClient]);

    const getReviewForSlot = useCallback((slotIndex: number) => {
        if (itemCount === 0) return null;
        return (currentIndex + slotIndex - 2 + itemCount) % itemCount;
    }, [currentIndex, itemCount]);

    return {
        currentIndex,
        hoveredId,
        setHoveredId: handleSetHoveredId,
        navigateToIndex,
        getSlotStyle,
        getReviewForSlot,
        VANGUARD_SLOTS
    };
}