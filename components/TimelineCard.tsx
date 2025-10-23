// components/TimelineCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SanityGameRelease } from '@/types/sanity';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useLivingCard } from '@/hooks/useLivingCard';
import styles from './TimelineCard.module.css';

import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'PC': PCIcon,
    'PS5': PS5Icon,
    'Xbox': XboxIcon,
    'Switch': SwitchIcon,
};

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg> );

const TimelineCardComponent = ({ release }: { release: SanityGameRelease }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = new Date(release.releaseDate);
    const day = date.getUTCDate();
    const monthIndex = date.getUTCMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}`;

    // --- THE DEFINITIVE FIX: ---
    const baseUrl = release.mainImage.url.split('?')[0];
    const imageUrl = `${baseUrl}?w=600&auto=format&q=80`;

    return (
        <motion.div 
            ref={livingCardRef} 
            onMouseMove={livingCardAnimation.onMouseMove} 
            onMouseEnter={livingCardAnimation.onHoverStart} 
            onMouseLeave={livingCardAnimation.onHoverEnd}
            className={styles.livingCardWrapper} 
            style={livingCardAnimation.style}
        >
            <Link href={`/games/${release.slug}`} className={`${styles.timelineCard} no-underline`} style={{transformStyle: 'preserve-3d'}}>
                <div className={styles.imageContainer} style={{ transform: 'translateZ(20px)' }}>
                    <Image
                        src={imageUrl}
                        alt={release.title}
                        fill
                        sizes="30vw"
                        className={styles.image}
                        placeholder="blur"
                        blurDataURL={release.mainImage.blurDataURL}
                        unoptimized
                    />
                    {new Date(release.releaseDate) < new Date() && <div className={styles.releasedBadge}><CheckIcon className={styles.checkIcon} /> صدرت</div>}
                    <div className={styles.synopsisOverlay}><p>{release.synopsis}</p></div>
                </div>
                <div className={styles.cardContent} style={{ transform: 'translateZ(40px)' }}>
                    <div className={styles.cardHeader}>
                        <h4>{release.title}</h4>
                        <p>{formattedDate}</p>
                    </div>
                    <div className={styles.platformIcons}>
                        {(release.platforms || []).map(p => { const Icon = PlatformIcons[p]; return Icon ? <Icon key={p} className={styles.platformIcon} title={p} /> : null; })}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default memo(TimelineCardComponent);