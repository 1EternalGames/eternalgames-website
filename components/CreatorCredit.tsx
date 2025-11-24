// components/CreatorCredit.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getCreatorUsernames } from '@/app/actions/creatorActions';
import type { SanityAuthor } from '@/types/sanity';
import { PenEdit02Icon, ColorPaletteIcon } from '@/components/icons/index';
import { urlFor } from '@/sanity/lib/image';
import styles from './CreatorCredit.module.css';

const hoverCardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' as const } }
};

// --- GLOBAL CACHE ---
// Stores resolved usernames: prismaUserId -> username
const usernameCache: Record<string, string | null> = {};
// Stores pending promises to dedup simultaneous requests
let pendingRequest: Promise<Record<string, string>> | null = null;
let pendingIds: Set<string> = new Set();
let debounceTimer: NodeJS.Timeout | null = null;

// Helper to fetch with batching
const batchFetchUsernames = (ids: string[]): Promise<Record<string, string>> => {
    // Add new IDs to the pending set
    ids.forEach(id => {
        if (!usernameCache.hasOwnProperty(id)) {
            pendingIds.add(id);
        }
    });

    if (pendingIds.size === 0) {
        return Promise.resolve({});
    }

    // Return existing promise if we are waiting for the debounce
    if (pendingRequest && debounceTimer) {
        return pendingRequest;
    }

    // Create a new promise that will resolve when the debounce fires
    pendingRequest = new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const idsToFetch = Array.from(pendingIds);
            pendingIds.clear();
            pendingRequest = null;
            debounceTimer = null;

            getCreatorUsernames(idsToFetch).then((results) => {
                // Update cache
                Object.entries(results).forEach(([id, username]) => {
                    usernameCache[id] = username as string;
                });
                // Mark missing ones as null to avoid refetching
                idsToFetch.forEach(id => {
                    if (!usernameCache.hasOwnProperty(id)) {
                        usernameCache[id] = null;
                    }
                });
                resolve(results as Record<string, string>);
            });
        }, 50); // 50ms debounce window to collect all components mounting at once
    });

    return pendingRequest;
};

const CreatorHoverCard = ({ creator }: { creator: SanityAuthor }) => {
    let imageUrl = '/default-avatar.svg';
    if (creator.image) {
        if (typeof creator.image === 'string') {
            imageUrl = creator.image;
        } else if (typeof creator.image === 'object' && (creator.image as any).asset) {
            imageUrl = urlFor(creator.image as any).width(96).height(96).fit('crop').url();
        }
    }

    return (
        <motion.div className={styles.hoverCard} variants={hoverCardVariants} initial="hidden" animate="visible" exit="exit">
            <div className={styles.cardHeader}>
                <Image 
                    src={imageUrl} 
                    alt={creator.name}
                    width={48}
                    height={48}
                    className={styles.cardAvatar}
                />
                <div>
                    <p className={styles.cardName}>{creator.name}</p>
                    {creator.username && <p className={styles.cardUsername}>@{creator.username}</p>}
                </div>
            </div>
            {creator.bio && <p className={styles.cardBio}>{creator.bio}</p>}
        </motion.div>
    );
};

const CreatorLink = ({ creator, disableLink }: { creator: SanityAuthor, disableLink?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const handleTouch = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <div 
            className={styles.creatorLinkContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered && <CreatorHoverCard creator={creator} />}
            </AnimatePresence>

            {creator.username && !disableLink ? (
                <Link 
                    href={`/creators/${creator.username}`} 
                    className="creator-credit-link no-underline"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={handleTouch}
                    prefetch={false} // FIX: Disable prefetch to prevent loading all creator pages
                >
                    {creator.name}
                </Link>
            ) : (
                <span className={creator.username ? "creator-credit-link" : ""}>{creator.name}</span>
            )}
        </div>
    );
};

export default function CreatorCredit({ label, creators, small = false, disableLink = false }: { 
    label: string; 
    creators: SanityAuthor[] | null | undefined;
    small?: boolean;
    disableLink?: boolean;
}) {
    const [enrichedCreators, setEnrichedCreators] = useState<SanityAuthor[]>(creators || []);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        const idsToFetch: string[] = [];
        
        // Check which creators need enrichment
        const needsUpdate = (creators || []).some(c => c && c.prismaUserId && !c.username && !usernameCache[c.prismaUserId]);
        
        // If we have cached values, apply them immediately
        const initialEnriched = (creators || []).map(creator => {
            if (creator.prismaUserId && usernameCache[creator.prismaUserId]) {
                return { ...creator, username: usernameCache[creator.prismaUserId] };
            }
            if (creator.prismaUserId && !creator.username && !usernameCache.hasOwnProperty(creator.prismaUserId)) {
                idsToFetch.push(creator.prismaUserId);
            }
            return creator;
        });

        setEnrichedCreators(initialEnriched);

        // If we gathered IDs that are missing from cache, fetch them
        if (idsToFetch.length > 0) {
            batchFetchUsernames(idsToFetch).then(() => {
                if (!mounted.current) return;
                // Re-map with new cached values
                setEnrichedCreators(prev => prev.map(creator => {
                    if (creator.prismaUserId && usernameCache[creator.prismaUserId]) {
                        return { ...creator, username: usernameCache[creator.prismaUserId] };
                    }
                    return creator;
                }));
            });
        }

        return () => { mounted.current = false; };
    }, [creators]);
    
    const hasCreators = enrichedCreators && enrichedCreators.length > 0;

    if (!hasCreators) {
        return null;
    }

    const formattedNames = enrichedCreators.map((creator, i) => (
        <React.Fragment key={`${creator._id}-${i}`}>
            {i > 0 && (i === enrichedCreators.length - 1 ? ' و ' : '، ')}
            <CreatorLink creator={creator} disableLink={disableLink} />
        </React.Fragment>
    ));

    const IconComponent = label === 'تصميم' ? ColorPaletteIcon : PenEdit02Icon;

    return (
        <div className={`${styles.creatorCredit} ${small ? styles.small : ''}`}>
             <IconComponent className={styles.metadataIcon} />
            <div>
                <span className={styles.label}>{label}: </span>
                <span>{formattedNames}</span>
            </div>
        </div>
    );
}