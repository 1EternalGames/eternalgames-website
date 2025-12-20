// hooks/useVanguardCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const VANGUARD_SLOTS = 5;
// FIX: Increased cooldown to match the 700ms transition duration to prevent interaction during movement
export const ANIMATION_COOLDOWN = 750; 
const AUTO_NAVIGATE_INTERVAL = 2500;
const MOBILE_BREAKPOINT = 1024;
const CENTER_SLOT_INDEX = 2;

export function useVanguardCarousel(itemCount: number, isCurrentlyInView: boolean) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
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
        if (itemCount > 0) {
            intervalRef.current = setInterval(() => {
                setIsAnimating(true);
                // FIX: Ensure hover is cleared when auto-navigating
                setHoveredId(null);
                setCurrentIndex(prevIndex => (prevIndex + 1) % itemCount);
                setTimeout(() => setIsAnimating(false), ANIMATION_COOLDOWN);
            }, AUTO_NAVIGATE_INTERVAL);
        }
    }, [itemCount, stopInterval]);

    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;
        setIsAnimating(true);
        // FIX: Force clear hover state on manual navigation to prevent "stuck" large cards
        setHoveredId(null);
        setCurrentIndex(index);
        startInterval(); 
        setTimeout(() => {
            setIsAnimating(false);
        }, ANIMATION_COOLDOWN);
    }, [isAnimating, currentIndex, startInterval]);

    useEffect(() => {
        if (!hoveredId && isCurrentlyInView && isPageVisible) {
            startInterval();
        } else {
            stopInterval();
        }
        return () => stopInterval();
    }, [hoveredId, isCurrentlyInView, isPageVisible, startInterval, stopInterval]);

    const handleSetHoveredId = useCallback((id: string | number | null) => {
        // Strict check: Cannot hover while animating
        if (isAnimating) return;
        setHoveredId(id);
    }, [isAnimating]);

    const getCardState = useCallback((reviewIndex: number, itemId: string | number) => {
        if (itemCount === 0) return { style: { opacity: 0 }, isCenter: false, isVisible: false };

        let diff = reviewIndex - currentIndex;
        if (diff > itemCount / 2) diff -= itemCount;
        if (diff < -itemCount / 2) diff += itemCount;
        const slotIndex = diff + CENTER_SLOT_INDEX;

        if (slotIndex < 0 || slotIndex >= VANGUARD_SLOTS) {
            const isFarRight = diff > 0;
            return {
                style: { opacity: 0, transform: `translateX(${isFarRight ? '150%' : '-150%'}) scale(0.5)`, zIndex: -1 },
                isCenter: false, isVisible: false,
            };
        }

        const isCenter = slotIndex === CENTER_SLOT_INDEX;
        const style: any = { opacity: 1, zIndex: 0 };
        
        let transform = '';
        const isHovered = hoveredId === itemId;

        if (isMobile) {
            style.left = '50%';
            const offsetPx = 140; 
            const baseTranslateX = '-50%'; // String literal for interpolation

            let xOffset = 0;
            let baseScale = 1;

            switch (slotIndex) {
                case 0: xOffset = -offsetPx * 1.6; baseScale = 0.75; style.zIndex = 0; break;
                case 1: xOffset = -offsetPx * 0.9; baseScale = 0.8;  style.zIndex = 1; break;
                case 2: xOffset = 0;               baseScale = 1;    style.zIndex = 2; break;
                case 3: xOffset = offsetPx * 0.9;  baseScale = 0.8;  style.zIndex = 1; break;
                case 4: xOffset = offsetPx * 1.6;  baseScale = 0.75; style.zIndex = 0; break;
            }

            // Calculate final scale with hover effect
            // We multiply the base scale instead of appending a second scale transform
            const hoverScaleMultiplier = isHovered ? 1.05 : 1;
            const finalScale = baseScale * hoverScaleMultiplier;

            // Apply Z-Index boost on hover
            if (isHovered) style.zIndex = 3;

            // Construct consistent transform string: translateX(calc) scale(val) translateY(val)
            // Using calc for ALL mobile states prevents interpolation glitches between "0px" and "calc()"
            transform = `translateX(calc(${baseTranslateX} + ${xOffset}px)) scale(${finalScale}) translateY(-50px)`;
            
        } else { // Desktop
            const offset = 250;
            let x = 0;
            let baseScale = 1;

            switch (slotIndex) {
                case 0: x = -offset * 1.6; baseScale = 0.6;  style.zIndex = 0; break;
                case 1: x = -offset * 0.9; baseScale = 0.65; style.zIndex = 1; break;
                case 2: x = 0;             baseScale = 1;    style.zIndex = 2; break;
                case 3: x = offset * 0.9;  baseScale = 0.65; style.zIndex = 1; break;
                case 4: x = offset * 1.6;  baseScale = 0.6;  style.zIndex = 0; break;
            }

            // Desktop Hover Logic: Lift instead of scale
            let yLift = -50;
            if (isHovered) {
                style.zIndex = 3;
                yLift -= 15; // Extra lift
            }

            transform = `translateX(${x}px) scale(${baseScale}) translateY(${yLift}px)`;
        }
        
        const isVisibleOnMobile = isMobile ? slotIndex >= 1 && slotIndex <= 3 : true;
        if (!isVisibleOnMobile) {
             style.pointerEvents = 'none';
             style.opacity = 0;
        }

        style.transform = transform;
        return { style, isCenter, isVisible: true };
    }, [currentIndex, itemCount, hoveredId, isMobile]);
    
    return {
        currentIndex,
        hoveredId,
        setHoveredId: handleSetHoveredId,
        navigateToIndex,
        getCardState,
        isMobile,
        isAnimating, // Exporting this for UI consumption
    };
}