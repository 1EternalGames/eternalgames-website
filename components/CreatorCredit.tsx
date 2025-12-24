// components/CreatorCredit.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { getCreatorUsernames } from '@/app/actions/creatorActions';
import type { SanityAuthor } from '@/types/sanity';
import { PenEdit02Icon, ColorPaletteIcon } from '@/components/icons/index';
import styles from './CreatorCredit.module.css';

const usernameCache: Record<string, string | null> = {};
let pendingRequest: Promise<Record<string, string>> | null = null;
let pendingIds: Set<string> = new Set();
let debounceTimer: NodeJS.Timeout | null = null;

const batchFetchUsernames = (ids: string[]): Promise<Record<string, string>> => {
    ids.forEach(id => {
        if (!usernameCache.hasOwnProperty(id)) {
            pendingIds.add(id);
        }
    });

    if (pendingIds.size === 0) {
        return Promise.resolve({});
    }

    if (pendingRequest && debounceTimer) {
        return pendingRequest;
    }

    pendingRequest = new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const idsToFetch = Array.from(pendingIds);
            pendingIds.clear();
            pendingRequest = null;
            debounceTimer = null;

            getCreatorUsernames(idsToFetch).then((results) => {
                Object.entries(results).forEach(([id, username]) => {
                    usernameCache[id] = username as string;
                });
                idsToFetch.forEach(id => {
                    if (!usernameCache.hasOwnProperty(id)) {
                        usernameCache[id] = null;
                    }
                });
                resolve(results as Record<string, string>);
            });
        }, 50); 
    });

    return pendingRequest;
};

export default function CreatorCredit({ label, creators, disableLink = false }: { 
    label: string; 
    creators: SanityAuthor[] | null | undefined;
    small?: boolean; 
    disableLink?: boolean;
}) {
    const safeCreators = Array.isArray(creators) ? creators : [];
    const [enrichedCreators, setEnrichedCreators] = useState<SanityAuthor[]>(safeCreators);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        setEnrichedCreators(safeCreators);
        
        const idsToFetch: string[] = [];
        
        const initialEnriched = safeCreators.map(creator => {
            if (creator.prismaUserId && usernameCache[creator.prismaUserId]) {
                return { ...creator, username: usernameCache[creator.prismaUserId] };
            }
            if (creator.prismaUserId && !creator.username && !usernameCache.hasOwnProperty(creator.prismaUserId)) {
                idsToFetch.push(creator.prismaUserId);
            }
            return creator;
        });

        setEnrichedCreators(initialEnriched);

        if (idsToFetch.length > 0) {
            batchFetchUsernames(idsToFetch).then(() => {
                if (!mounted.current) return;
                setEnrichedCreators(prev => prev.map(creator => {
                    if (creator.prismaUserId && usernameCache[creator.prismaUserId]) {
                        return { ...creator, username: usernameCache[creator.prismaUserId] };
                    }
                    return creator;
                }));
            });
        }

        return () => { mounted.current = false; };
    }, [safeCreators]); 
    
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
                        <Link 
                            key={creator._id}
                            href={`/creators/${creator.username}`}
                            className={`${styles.creditCapsule} no-underline`}
                            prefetch={false}
                        >
                            {content}
                        </Link>
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