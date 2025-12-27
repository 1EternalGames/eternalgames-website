// components/CreatorCredit.tsx
'use client';

import React from 'react';
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

    const enrichedCreators = safeCreators.map(creator => {
        if (creator.username) return creator;
        // Try to resolve username from store if missing in prop
        if (creator.prismaUserId) {
            for (const c of creatorMap.values()) {
                if (c.prismaUserId === creator.prismaUserId && c.username) {
                    return { ...creator, username: c.username };
                }
            }
        }
        if (creator._id) {
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
                
                // Construct partial data to seed the store instantly
                const creatorData = { name: creator.name, image: creator.image };

                if (creator.username && !disableLink) {
                    return (
                        <KineticLink 
                            key={creator._id}
                            href={`/creators/${creator.username}`}
                            slug={creator.username}
                            type="creators"
                            className={`${styles.creditCapsule} no-underline`}
                            onClick={(e) => e.stopPropagation()} 
                            // PASS PRELOADED DATA
                            preloadedData={creatorData}
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