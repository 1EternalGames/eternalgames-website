// components/CreatorCredit.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { SanityAuthor } from '@/types/sanity';
import { PenEdit02Icon, ColorPaletteIcon } from '@/components/icons/index';
import styles from './CreatorCredit.module.css';
import { useContentStore } from '@/lib/contentStore'; 
import KineticLink from '@/components/kinetic/KineticLink';

export default function CreatorCredit({ label, creators, disableLink = false }: { 
    label: string; 
    creators: SanityAuthor[] | null | undefined;
    small?: boolean; 
    disableLink?: boolean;
}) {
    const safeCreators = Array.isArray(creators) ? creators : [];
    const { creatorMap } = useContentStore(); 

    // Directly derive state from props + store. No useEffect delay.
    const enrichedCreators = safeCreators.map(creator => {
        // 1. Check if username is already on the object (Sanity enriched it)
        if (creator.username) return creator;
        
        // 2. Check Client Store by Prisma ID
        if (creator.prismaUserId) {
            // Iterate map values to find by prismaUserId
            // (Store is keyed by username, but object has prismaUserId)
            for (const c of creatorMap.values()) {
                if (c.prismaUserId === creator.prismaUserId && c.username) {
                    return { ...creator, username: c.username };
                }
            }
        }
        
        // 3. Check Client Store by Sanity ID
        if (creator._id) {
             // creatorMap stores data by username usually, but let's check values
             for (const c of creatorMap.values()) {
                 if (c._id === creator._id && c.username) {
                     return { ...creator, username: c.username };
                 }
             }
        }

        return creator;
    });

    if (!enrichedCreators || enrichedCreators.length === 0) {
        return null;
    }

    const IconComponent = label === 'تصميم' ? ColorPaletteIcon : PenEdit02Icon;

    return (
        <div className={styles.creatorsWrapper}>
            {enrichedCreators.map((creator) => {
                const content = (
                    <>
                        <div className={styles.capsuleIcon}>
                            <IconComponent style={{ width: 14, height: 14 }} />
                        </div>
                        <span className={styles.creatorName}>{creator.name}</span>
                    </>
                );

                if (creator.username && !disableLink) {
                    return (
                        <KineticLink 
                            key={creator._id}
                            href={`/creators/${creator.username}`}
                            slug={creator.username}
                            type="creators"
                            className={`${styles.creditCapsule} no-underline`}
                            onClick={(e) => e.stopPropagation()} 
                        >
                            {content}
                        </KineticLink>
                    );
                }

                return (
                    <div key={creator._id} className={styles.creditCapsule}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}