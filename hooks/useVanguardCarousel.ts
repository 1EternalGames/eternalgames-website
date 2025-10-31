// hooks/useVanguardCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DESKTOP_SLOTS = 5;
const MOBILE_SLOTS = 3;
const ANIMATION_COOLDOWN = 450;
const AUTO_NAVIGATE_INTERVAL = 4000;
const MOBILE_BREAKPOINT = 1024;

export function useVanguardCarousel(itemCount: number, isCurrentlyInView: boolean) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
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
        const style: any = { opacity: 1, zIndex: 0 };
        let transform = '';

        if (isMobile) {
            style.width = `var(--${index === 1 ? 'center' : 'side'}-width)`;
            style.height = index === 1 ? '380px' : '300px';
            const offset = '45vw'; // Use vw for responsive positioning

            switch (index) {
                case 0: transform = `translateX(-${offset}) scale(0.85)`; style.zIndex = 1; break;
                case 1: transform = `translateX(0) scale(1)`; style.zIndex = 2; break;
                case 2: transform = `translateX(${offset}) scale(0.85)`; style.zIndex = 1; break;
                default: style.opacity = 0;
            }
        } else { // Desktop
            style.width = `var(--${index === 2 ? 'center' : 'side'}-width)`;
            style.height = index === 2 ? '500px' : '350px';
            const offset = 250;

            switch (index) {
                case 0: transform = `translateX(${-offset * 1.7}px) scale(0.75)`; break;
                case 1: transform = `translateX(${-offset}px) scale(0.85)`; style.zIndex = 1; break;
                case 2: transform = `translateX(0) scale(1)`; style.zIndex = 2; break;
                case 3: transform = `translateX(${offset}px) scale(0.85)`; style.zIndex = 1; break;
                case 4: transform = `translateX(${offset * 1.7}px) scale(0.75)`; break;
                default: style.opacity = 0;
            }
        }

        if (hoveredId === itemId && !isMobile) { // Hover effect disabled on mobile for simplicity
            style.zIndex = 3;
            transform += ' translateY(-15px)';
        }

        style.transform = transform;
        return style;
    }, [hoveredId, isMobile]);

    const getReviewForSlot = useCallback((slotIndex: number) => {
        if (itemCount === 0) return null;
        const centerOffset = isMobile ? 1 : 2;
        return (currentIndex + slotIndex - centerOffset + itemCount) % itemCount;
    }, [currentIndex, itemCount, isMobile]);
    
    const VANGUARD_SLOTS = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;

    return {
        currentIndex,
        hoveredId,
        setHoveredId: handleSetHoveredId,
        navigateToIndex,
        getSlotStyle,
        getReviewForSlot,
        VANGUARD_SLOTS,
        isMobile,
    };
}