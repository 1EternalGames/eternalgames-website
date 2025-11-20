// hooks/useLivingCard.ts
'use client';

import { useRef, useState } from 'react';
import { MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';

const springConfig = { stiffness: 250, damping: 25 };

/**
 * A custom hook to apply a "living card" 3D tilt and shadow effect.
 * @param {object} options - Optional configuration.
 * @param {boolean} options.isLead - If true, applies a more subtle rotation effect.
 * @returns An object containing the ref and motion props to apply to a Framer Motion component.
 */
// THE FIX: Made the hook generic to support HTMLAnchorElement, HTMLDivElement, etc.
export function useLivingCard<T extends HTMLElement = HTMLDivElement>({ isLead = false } = {}) {
    const ref = useRef<T>(null);
    const { resolvedTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const smoothMouseX = useSpring(mouseX, springConfig);
    const smoothMouseY = useSpring(mouseY, springConfig);

    const rotateMultiplier = isLead ? 8 / 15 : 1;
    const rotateX = useTransform(smoothMouseY, [0, 1], [15 * rotateMultiplier, -15 * rotateMultiplier]);
    const rotateY = useTransform(smoothMouseX, [0, 1], [-15 * rotateMultiplier, 15 * rotateMultiplier]);
    const scale = useSpring(isHovered ? 1.03 : 1, { stiffness: 400, damping: 30 });

    const transform = useTransform(
        [rotateX, rotateY, scale],
        ([rX, rY, s]: (string | number)[]) => `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(${s})`
    );

    const boxShadow = useTransform<number, string>(
        [smoothMouseX, smoothMouseY],
        ([x, y]: number[]) => {
            const offsetX = (0.5 - x) * 30;
            const offsetY = (0.5 - y) * 30;
            const shadowOpacity = isHovered ? 0.1 : 0;
            const shadowColor = resolvedTheme === 'dark' 
                ? `rgba(0, 229, 255, ${shadowOpacity})`
                : `rgba(0, 0, 0, ${shadowOpacity * 1.5})`;
            return `${offsetX}px ${offsetY}px 35px ${shadowColor}`;
        }
    );

    // THE FIX: Updated event type to accept the generic T
    const handlePointerMove = (e: React.MouseEvent<T> | React.TouchEvent<T>) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent<T>).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent<T>).clientY;

        mouseX.set((clientX - left) / width);
        mouseY.set((clientY - top) / height);
    };
    
    const onPointerEnter = () => {
        setIsHovered(true);
    };

    const onPointerLeave = () => {
        setIsHovered(false);
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    return {
        livingCardRef: ref,
        livingCardAnimation: {
            style: {
                transform,
                boxShadow,
            },
            onMouseMove: handlePointerMove,
            onTouchMove: handlePointerMove,
            onMouseEnter: onPointerEnter,
            onMouseLeave: onPointerLeave,
            // THE FIX: Updated event type to accept the generic T
            onTouchStart: (e: React.TouchEvent<T>) => {
                onPointerEnter();
                handlePointerMove(e);
            },
            onTouchEnd: onPointerLeave,
            onTouchCancel: onPointerLeave,
        },
    };
}