// components/CreatorCredit.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getCreatorUsernames } from '@/app/actions/creatorActions';
import type { SanityAuthor } from '@/types/sanity';
import { PenEdit02Icon, ColorPaletteIcon } from '@/components/icons';
import styles from './CreatorCredit.module.css';

const hoverCardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' as const } }
};

const CreatorHoverCard = ({ creator }: { creator: SanityAuthor }) => (
    <motion.div className={styles.hoverCard} variants={hoverCardVariants} initial="hidden" animate="visible" exit="exit">
        <div className={styles.cardHeader}>
            <Image 
                src={creator.image || '/default-avatar.svg'} 
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

const CreatorLink = ({ creator, disableLink }: { creator: SanityAuthor, disableLink?: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);

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
    const [enrichedCreators, setEnrichedCreators] = useState(creators || []);

    useEffect(() => {
        const creatorsWithoutUsername = (creators || []).filter(c => c && c.prismaUserId && !c.username);

        if (creatorsWithoutUsername.length > 0) {
            const idsToFetch = creatorsWithoutUsername.map(c => c.prismaUserId);
            getCreatorUsernames(idsToFetch).then(usernameMap => {
                setEnrichedCreators(prevCreators => 
                    prevCreators.map(creator => {
                        if (creator.prismaUserId && usernameMap[creator.prismaUserId]) {
                            return { ...creator, username: usernameMap[creator.prismaUserId] };
                        }
                        return creator;
                    })
                );
            });
        } else {
            setEnrichedCreators(creators || []);
        }
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
            <span className={styles.label}>{label}: </span>
            <span>{formattedNames}</span>
        </div>
    );
}


