// hooks/useIsMobile.ts
'use client';

import { useState, useEffect } from 'react';

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Detect both screen size AND pointer type (to catch tablets/hybrid devices)
            const isSmallScreen = window.innerWidth <= 768;
            const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
            setIsMobile(isSmallScreen || isTouch);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}


