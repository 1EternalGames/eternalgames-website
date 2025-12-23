// components/about/StaffCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sanityLoader } from '@/lib/sanity.loader';

interface StaffCardProps {
    name: string;
    username: string | null;
    imageUrl: string;
}

export default function StaffCard({ name, username, imageUrl }: StaffCardProps) {
    const profileLink = username ? `/creators/${username}` : null;

    const Content = (
        <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '2rem',
            textAlign: 'center',
            height: '100%',
            transition: 'transform 0.2s ease, border-color 0.2s ease',
            cursor: profileLink ? 'pointer' : 'default'
        }}
        className="staff-card-inner"
        >
            <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                margin: '0 auto 1.5rem auto',
                border: '2px solid var(--border-color)',
                position: 'relative'
            }}>
                <Image 
                    loader={sanityLoader}
                    src={imageUrl} 
                    alt={name} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                />
            </div>
            <h3 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {name}
            </h3>
            {username && (
                <p style={{ fontSize: '1.4rem', color: 'var(--accent)', margin: 0, direction: 'ltr' }}>
                    @{username}
                </p>
            )}
            
            <style jsx>{`
                .staff-card-inner:hover {
                    transform: translateY(-5px);
                    border-color: var(--accent) !important;
                }
            `}</style>
        </div>
    );

    if (profileLink) {
        return (
            <Link href={profileLink} className="no-underline" style={{ display: 'block', height: '100%' }}>
                {Content}
            </Link>
        );
    }

    return (
        <div style={{ display: 'block', height: '100%' }}>
            {Content}
        </div>
    );
}