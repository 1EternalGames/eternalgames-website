// components/studio/social/review-card/utils.ts
'use client';

import React from 'react';
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

export const PLATFORM_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    PC: PCIcon,
    PS5: PS5Icon,
    XSX: XboxIcon,
    NSW: SwitchIcon
};


