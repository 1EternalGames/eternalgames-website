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
export function useLivingCard({ isLead = false } = {}) {
    const ref = useRef<HTMLDivElement>(null);
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

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const onHoverStart = () => {
        setIsHovered(true);
    };

    const onHoverEnd = () => {
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
            onMouseMove: handleMouseMove,
            onHoverStart: onHoverStart,
            onHoverEnd: onHoverEnd,
        },
    };
}


