// hooks/useKineticCarousel.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseKineticCarouselProps {
    itemCount: number;
    slots: number;
    isHovered: boolean;
    isInView: boolean;
    autoAdvanceInterval?: number;
}

export function useKineticCarousel({ itemCount, slots, isHovered, isInView, autoAdvanceInterval = 2500 }: UseKineticCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const startInterval = useCallback(() => {
        stopInterval();
        if (itemCount > 0) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % itemCount);
            }, autoAdvanceInterval);
        }
    }, [itemCount, autoAdvanceInterval, stopInterval]);

    const navigateToIndex = useCallback((index: number) => {
        if (isAnimating || index === currentIndex) return;
        setIsAnimating(true);
        setCurrentIndex(index);
        startInterval();
        setTimeout(() => setIsAnimating(false), 450); // Cooldown
    }, [isAnimating, currentIndex, startInterval]);

    useEffect(() => {
        if (!isHovered && isInView) {
            startInterval();
        } else {
            stopInterval();
        }
        return () => stopInterval();
    }, [isHovered, isInView, startInterval, stopInterval]);

    const getOrderedItems = useCallback((items: any[]) => {
        const centerIndex = Math.floor(slots / 2);
        return Array.from({ length: slots }).map((_, i) => {
            const itemIndex = (currentIndex + i - centerIndex + itemCount) % itemCount;
            return { item: items[itemIndex], slotIndex: i };
        });
    }, [currentIndex, itemCount, slots]);

    const getSlotStyle = useCallback((slotIndex: number, itemId: string | number, hoveredId: string | number | null) => {
        const centerIndex = Math.floor(slots / 2);
        const style: any = {
            width: `var(--${slotIndex === centerIndex ? 'center' : 'side'}-width)`,
            height: slotIndex === centerIndex ? '500px' : '350px',
            opacity: 1,
            zIndex: 0
        };
        const offset = (typeof window !== 'undefined' && window.innerWidth > 768) ? 250 : 160;
        let transform = '';
        
        switch (slotIndex) {
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
    }, [slots]);

    return {
        currentIndex,
        navigateToIndex,
        getOrderedItems,
        getSlotStyle,
    };
}