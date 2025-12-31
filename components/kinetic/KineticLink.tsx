// components/kinetic/KineticLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useContentStore } from '@/lib/contentStore';
import { startNavigation } from '@/components/ui/ProgressBar';

interface KineticLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    slug: string;
    type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators' | 'tags';
    layoutId?: string;
    children: React.ReactNode;
    className?: string;
    imageSrc?: string; 
    overrideUrl?: string; 
    preloadedData?: any; 
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ 
    href, 
    slug, 
    type, 
    layoutId, 
    children, 
    className, 
    onClick, 
    imageSrc, 
    overrideUrl,
    preloadedData,
    ...props 
}: KineticLinkProps) {
    const { contentMap, openOverlay, fetchFullContent } = useContentStore();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);

        // Check if we should open in overlay
        let hasData = false;
        if (type === 'creators' || type === 'tags') {
            hasData = true; 
        } else {
            hasData = contentMap.has(slug);
        }

        if (hasData) {
            e.preventDefault();
            e.stopPropagation(); 
            openOverlay(slug, type, layoutId, imageSrc, overrideUrl, preloadedData);
        } else {
            // Standard Navigation - Trigger Loading Bar
            startNavigation();
        }
    };

    // UX OPTIMIZATION: Prefetch full content on hover.
    // This bridges the gap between "Light Data" (Bandwidth Saver) and "Instant Click" (UX).
    // Only fetches if not already loaded.
    const handleMouseEnter = () => {
        if (['reviews', 'articles', 'news'].includes(type)) {
            const item = contentMap.get(slug);
            // Only fetch if it exists in store (from list) but body isn't loaded
            if (item && !item.contentLoaded) {
                fetchFullContent(slug);
            }
        }
    };

    return (
        <Link 
            href={href} 
            className={className} 
            onClick={handleClick}
            onMouseEnter={handleMouseEnter} // Trigger smart prefetch
            {...props} 
            // FIX: Disable prefetch to prevent massive bandwidth usage on home/list pages.
            // Since we manually prefetch on hover, automatic viewport prefetch is redundant/wasteful.
            prefetch={false} 
        >
            {children}
        </Link>
    );
}