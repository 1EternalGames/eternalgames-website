// hooks/useVanguardCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePerformanceStore } from '@/lib/performanceStore';

const VANGUARD_SLOTS = 5;
export const ANIMATION_COOLDOWN = 750; 
const AUTO_NAVIGATE_INTERVAL = 2500;
const MOBILE_BREAKPOINT = 1024;
const CENTER_SLOT_INDEX = 2;

// --- Helper type for raw transform data ---
export type CarouselCardLayout = {
    x: number;
    y: number;
    scale: number;
    zIndex: number;
    opacity: number;
    pointerEvents: 'auto' | 'none';
    visibility: 'visible' | 'hidden';
};

export function useVanguardCarousel(itemCount: number, isCurrentlyInView: boolean) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Check performance settings
    const { isCarouselAutoScrollEnabled } = usePerformanceStore();
    
    useEffect(() => {
        const checkDevice = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => setIsPageVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const stopInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const startInterval = useCallback(() => {
        stopInterval();
        // Only start if auto-scroll is enabled
        if (itemCount > 0 && isCarouselAutoScrollEnabled) {
            intervalRef.current = setInterval(() => {
                setIsAnimating(true);
                setHoveredId(null);
                setCurrentIndex(prevIndex => (prevIndex + 1) % itemCount);
                setTimeout(() => setIsAnimating(false), ANIMATION_COOLDOWN);
            }, AUTO_NAVIGATE_INTERVAL);
        }
    }, [itemCount, stopInterval, isCarouselAutoScrollEnabled]);

    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;
        setIsAnimating(true);
        setHoveredId(null);
        setCurrentIndex(index);
        startInterval(); 
        setTimeout(() => {
            setIsAnimating(false);
        }, ANIMATION_COOLDOWN);
    }, [isAnimating, currentIndex, startInterval]);

    useEffect(() => {
        // Only run if auto-scroll enabled
        if (!hoveredId && isCurrentlyInView && isPageVisible && isCarouselAutoScrollEnabled) {
            startInterval();
        } else {
            stopInterval();
        }
        return () => stopInterval();
    }, [hoveredId, isCurrentlyInView, isPageVisible, startInterval, stopInterval, isCarouselAutoScrollEnabled]);

    const handleSetHoveredId = useCallback((id: string | number | null) => {
        if (isAnimating) return;
        setHoveredId(id);
    }, [isAnimating]);

    const getCardState = useCallback((reviewIndex: number, itemId: string | number) => {
        // Default "Hidden" State
        const hiddenLayout: CarouselCardLayout = {
            x: 0,
            y: 0,
            scale: 0.5,
            zIndex: -1,
            opacity: 0,
            pointerEvents: 'none',
            visibility: 'hidden'
        };

        if (itemCount === 0) return { layout: hiddenLayout, isCenter: false, isVisible: false, slotIndex: -1 };

        let diff = reviewIndex - currentIndex;
        if (diff > itemCount / 2) diff -= itemCount;
        if (diff < -itemCount / 2) diff += itemCount;
        const slotIndex = diff + CENTER_SLOT_INDEX;

        if (slotIndex < 0 || slotIndex >= VANGUARD_SLOTS) {
            // Determine exit direction for smoother fade
            const isFarRight = diff > 0;
            return {
                layout: { 
                    ...hiddenLayout,
                    x: isFarRight ? 600 : -600 // Push far off screen
                },
                isCenter: false, 
                isVisible: false,
                slotIndex
            };
        }

        const isCenter = slotIndex === CENTER_SLOT_INDEX;
        const isHovered = hoveredId === itemId;

        // Base layout values
        let x = 0;
        let y = 0;
        let scale = 1;
        let zIndex = 10;

        const BASE_Z = 10;
        const CENTER_Z = 20;
        const HOVER_Z = 100; // Increased to ensure it pops well above others

        if (isMobile) {
            // Mobile Layout Logic
            const offsetPx = 140; 
            
            switch (slotIndex) {
                case 0: x = -offsetPx * 1.6; scale = 0.75; zIndex = BASE_Z; break;
                case 1: x = -offsetPx * 0.9; scale = 0.8;  zIndex = BASE_Z + 1; break;
                case 2: x = 0;               scale = 1;    zIndex = CENTER_Z; break;
                case 3: x = offsetPx * 0.9;  scale = 0.8;  zIndex = BASE_Z + 1; break;
                case 4: x = offsetPx * 1.6;  scale = 0.75; zIndex = BASE_Z; break;
            }

            // Mobile Y Adjustment
            y = -80; 

            // Hover Scale & Z-Index
            if (isHovered) {
                scale *= 1.05;
                zIndex = HOVER_Z;
            }
            
        } else { // Desktop Layout Logic
            const offset = 250;
            
            switch (slotIndex) {
                case 0: x = -offset * 1.6; scale = 0.6;  zIndex = BASE_Z; break;
                case 1: x = -offset * 0.9; scale = 0.65; zIndex = BASE_Z + 1; break;
                case 2: x = 0;             scale = 1;    zIndex = CENTER_Z; break;
                case 3: x = offset * 0.9;  scale = 0.65; zIndex = BASE_Z + 1; break;
                case 4: x = offset * 1.6;  scale = 0.6;  zIndex = BASE_Z; break;
            }

            // Desktop Vertical Position
            y = -80;

            // Hover Logic
            if (isHovered) {
                zIndex = HOVER_Z; // Apply highest Z-Index
                y -= 15; // Lift up slightly
            }
        }

        const isVisibleOnMobile = isMobile ? slotIndex >= 1 && slotIndex <= 3 : true;
        
        return { 
            layout: {
                x,
                y,
                scale,
                zIndex,
                opacity: isVisibleOnMobile ? 1 : 0,
                pointerEvents: isVisibleOnMobile ? 'auto' : 'none',
                visibility: isVisibleOnMobile ? 'visible' : 'hidden'
            },
            isCenter, 
            isVisible: true, 
            slotIndex 
        };
    }, [currentIndex, itemCount, hoveredId, isMobile]);
    
    return {
        currentIndex,
        hoveredId,
        setHoveredId: handleSetHoveredId,
        navigateToIndex,
        getCardState,
        isMobile,
        isAnimating,
    };
}