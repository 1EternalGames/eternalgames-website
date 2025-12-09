// components/studio/social/monthly-games/utils.tsx
'use client';

import React from 'react';
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

// Simple Cloud Icon since it wasn't in the global set yet
export const CloudIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6,17 L18,17 C21,17 23,15 23,12 C23,9 21,7 18,7 C18,3 15,2 11,2 C7,2 4,4 3,7 C1,7 -1,9 0,13 C1,16 3,17 6,17 Z" />
    </svg>
);

export const PLATFORM_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    PC: PCIcon,
    PS5: PS5Icon,
    XSX: XboxIcon,
    NSW: SwitchIcon,
    Cloud: CloudIcon,
};