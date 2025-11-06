// hooks/useVanguardCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const VANGUARD_SLOTS = 5;
export const ANIMATION_COOLDOWN = 450;
const AUTO_NAVIGATE_INTERVAL = 3000;
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
                setCurrentIndex(prevIndex => (prevIndex + 1) % itemCount);
                setTimeout(() => setIsAnimating(false), ANIMATION_COOLDOWN);
            }, AUTO_NAVIGATE_INTERVAL);
        }
    }, [itemCount, stopInterval]);

    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;
        setIsAnimating(true);
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

        if (isMobile) {
            style.left = '50%';
            const offsetPx = 140; 
            const baseTranslateX = '-50%';

            switch (slotIndex) {
                case 0: // Far Left
                    transform = `translateX(calc(${baseTranslateX} - ${offsetPx * 1.6}px)) scale(0.75)`;
                    style.zIndex = 0;
                    break;
                case 1: // Near Left
                    transform = `translateX(calc(${baseTranslateX} - ${offsetPx * 0.9}px)) scale(0.8)`;
                    style.zIndex = 1;
                    break;
                case 2: // Center
                    transform = `translateX(${baseTranslateX}) scale(1)`;
                    style.zIndex = 2;
                    break;
                case 3: // Near Right
                    transform = `translateX(calc(${baseTranslateX} + ${offsetPx * 0.9}px)) scale(0.8)`;
                    style.zIndex = 1;
                    break;
                case 4: // Far Right
                    transform = `translateX(calc(${baseTranslateX} + ${offsetPx * 1.6}px)) scale(0.75)`;
                    style.zIndex = 0;
                    break;
            }
        } else { // Desktop
            const offset = 250;
            switch (slotIndex) {
                case 0: transform = `translateX(${-offset * 1.6}px) scale(0.6)`; break;
                case 1: transform = `translateX(${-offset * 0.9}px) scale(0.65)`; style.zIndex = 1; break;
                case 2: transform = `translateX(0) scale(1)`; style.zIndex = 2; break;
                case 3: transform = `translateX(${offset * 0.9}px) scale(0.65)`; style.zIndex = 1; break;
                case 4: transform = `translateX(${offset * 1.6}px) scale(0.6)`; break;
            }
        }
        
        // Apply universal vertical lift
        transform += ' translateY(-50px)';

        if (hoveredId === itemId && !isMobile) {
            style.zIndex = 3;
            transform += ' translateY(-15px)'; // This composes with the base lift
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
    };
}