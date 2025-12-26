// components/kinetic/KineticLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useContentStore } from '@/lib/contentStore';

interface KineticLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    slug: string;
    type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators' | 'tags';
    layoutId?: string;
    children: React.ReactNode;
    className?: string;
    imageSrc?: string; 
    overrideUrl?: string; 
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ href, slug, type, layoutId, children, className, onClick, imageSrc, overrideUrl, ...props }: KineticLinkProps) {
    const { contentMap, openOverlay } = useContentStore();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        let hasData = false;

        // Force overlay attempt for types that support lazy fetching or are always "available" via ID/Slug
        if (type === 'creators' || type === 'tags') {
            hasData = true; 
        } else {
            // For standard content (reviews/articles), only open overlay if data is already in store
            hasData = contentMap.has(slug);
        }

        if (hasData) {
            // ONLY execute custom click logic (animations/prefix setting) if we are staying in the Kinetic system
            if (onClick) onClick(e);
            
            e.preventDefault();
            e.stopPropagation(); 
            // @ts-ignore
            openOverlay(slug, type, layoutId, imageSrc, overrideUrl);
        }
        // If !hasData, we do NOT call onClick. 
        // This prevents 'setPrefix' from running, avoiding layout transition conflicts during standard navigation.
        // Next.js Link handles the rest automatically.
    };

    return (
        <Link 
            href={href} 
            className={className} 
            onClick={handleClick} 
            {...props} 
            prefetch={false} 
        >
            {children}
        </Link>
    );
}