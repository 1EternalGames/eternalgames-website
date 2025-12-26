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
        if (onClick) onClick(e);

        let hasData = false;

        // Force overlay attempt for types that support lazy fetching or are always "available" via ID/Slug
        if (type === 'creators' || type === 'tags') {
            hasData = true; 
        } else {
            // For standard content (reviews/articles), only open overlay if data is already in store
            hasData = contentMap.has(slug);
        }

        if (hasData) {
            e.preventDefault();
            e.stopPropagation(); 
            // @ts-ignore
            openOverlay(slug, type, layoutId, imageSrc, overrideUrl);
        }
    };

    return (
        <Link 
            href={href} 
            className={className} 
            onClick={handleClick} 
            // FIXED: Removed scroll={false}. 
            // If we fall back to standard navigation (hasData = false), we WANT standard scroll-to-top behavior.
            // If we use overlay (hasData = true), preventDefault() cancels this anyway.
            {...props} 
            prefetch={false} 
        >
            {children}
        </Link>
    );
}