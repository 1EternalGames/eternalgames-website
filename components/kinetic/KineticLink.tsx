// components/kinetic/KineticLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useContentStore } from '@/lib/contentStore';

interface KineticLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    slug: string;
    type: 'reviews' | 'articles' | 'news' | 'releases' | 'games' | 'creators' | 'tags'; // UPDATED
    layoutId?: string;
    children: React.ReactNode;
    className?: string;
    imageSrc?: string; 
    overrideUrl?: string; 
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ href, slug, type, layoutId, children, className, onClick, imageSrc, overrideUrl, ...props }: KineticLinkProps) {
    const { contentMap, creatorMap, tagMap, openOverlay } = useContentStore(); // UPDATED

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);

        let hasData = false;

        if (type === 'creators') {
            hasData = true; 
        } else if (type === 'tags') {
            hasData = true; // Always attempt overlay for tags, fetch happens in overlay if missing
        } else {
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
            scroll={false} 
            {...props} 
            prefetch={false} 
        >
            {children}
        </Link>
    );
}