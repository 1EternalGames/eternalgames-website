// components/kinetic/KineticLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useContentStore } from '@/lib/contentStore';
import { useRouter } from 'next/navigation';

interface KineticLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    slug: string;
    type: 'reviews' | 'articles' | 'news' | 'releases';
    layoutId?: string; // The ID of the card being clicked
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export default function KineticLink({ href, slug, type, layoutId, children, className, onClick, ...props }: KineticLinkProps) {
    const { contentMap, openOverlay } = useContentStore();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);

        // 1. Check if we have the data
        if (contentMap.has(slug)) {
            // 2. STOP actual navigation
            e.preventDefault();
            // 3. Trigger Overlay with the layout ID for smooth transition
            openOverlay(slug, type, layoutId);
        }
        // Else: Fallback to normal Next.js Link behavior
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