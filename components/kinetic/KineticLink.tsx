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
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ href, slug, type, layoutId, children, className, onClick, ...props }: KineticLinkProps) {
    const { contentMap, openOverlay } = useContentStore();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // 1. Run any custom onClick logic passed from parent (e.g., setting scroll pos)
        if (onClick) onClick(e);

        // 2. Check Data Lake
        // We check for the raw slug OR the slug within an object structure just in case
        const hasData = contentMap.has(slug);

        if (hasData) {
            // 3. INTERCEPT: Kill the browser navigation immediately
            e.preventDefault();
            e.stopPropagation(); // Stop bubbling to be safe
            
            // 4. Trigger Instant Overlay
            openOverlay(slug, type, layoutId);
        } else {
            // Debug: If you see this in console, the hydration failed or IDs mismatch
            // console.warn(`[Kinetic] Miss for slug: ${slug}. Falling back to router.`);
        }
    };

    return (
        <Link 
            href={href} 
            className={className} 
            onClick={handleClick} 
            scroll={false} 
            {...props} 
            // Disable Next.js prefetching since we manage data ourselves
            prefetch={false}
        >
            {children}
        </Link>
    );
}