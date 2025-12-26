// components/kinetic/KineticLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useContentStore } from '@/lib/contentStore';

interface KineticLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    slug: string;
    type: 'reviews' | 'articles' | 'news' | 'releases';
    layoutId?: string;
    children: React.ReactNode;
    className?: string;
    imageSrc?: string; 
    overrideUrl?: string; // <--- NEW: Allows masking the URL
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ href, slug, type, layoutId, children, className, onClick, imageSrc, overrideUrl, ...props }: KineticLinkProps) {
    const { contentMap, openOverlay } = useContentStore();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // 1. Run any custom onClick logic passed from parent (e.g., setting scroll pos)
        if (onClick) onClick(e);

        // 2. Check Data Lake
        const hasData = contentMap.has(slug);

        if (hasData) {
            // 3. INTERCEPT: Kill the browser navigation immediately
            e.preventDefault();
            e.stopPropagation(); 
            
            // 4. Trigger Instant Overlay
            // Pass the imageSrc to the store so the overlay can use it instantly for the morph target
            // Pass overrideUrl to control browser history
            openOverlay(slug, type, layoutId, imageSrc, overrideUrl);
        } else {
            // Fallback to router navigation if data is missing
        }
    };

    return (
        <Link 
            href={href} 
            className={className} 
            onClick={handleClick} 
            scroll={false} 
            {...props} 
            prefetch={false} // <--- CRITICAL: Prevents double-fetching
        >
            {children}
        </Link>
    );
}