// components/ReleaseCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SanityGameRelease } from '@/types/sanity';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { memo } from 'react';
import { useLivingCard } from '@/hooks/useLivingCard';
import { urlFor } from '@/sanity/lib/image';
import styles from './ReleaseCard.module.css';

import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'PC': PCIcon, 'PlayStation': PS5Icon, 'Xbox': XboxIcon, 'Switch': SwitchIcon,
};

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg> );

interface ReleaseCardProps {
    release: SanityGameRelease;
    variant?: 'timeline' | 'kinetic';
}

const ReleaseCardComponent = ({ release, variant = 'timeline' }: ReleaseCardProps) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    
    // --- Glare effect logic from ChronoCard ---
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 150, mass: 0.7 });
    const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 150, mass: 0.7 });
    const glareX = useTransform(smoothMouseX, [0, 1], ['0%', '100%']);
    const glareY = useTransform(smoothMouseY, [0, 1], ['0%', '100%']);
    const glareOpacity = useTransform(smoothMouseX, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        livingCardAnimation.onMouseMove(e);
        if (!livingCardRef.current || variant !== 'kinetic') return;
        const { left, top, width, height } = livingCardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const handleMouseLeave = () => {
        livingCardAnimation.onMouseLeave();
        if (variant === 'kinetic') {
            mouseX.set(0.5);
            mouseY.set(0.5);
        }
    };
    // --- End of glare logic ---

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const date = new Date(release.releaseDate);
    const day = date.getUTCDate();
    const monthIndex = date.getUTCMonth();
    const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}`;

    return (
        <motion.div 
            ref={livingCardRef} 
            onMouseMove={handleMouseMove} 
            onMouseEnter={livingCardAnimation.onMouseEnter} 
            onMouseLeave={handleMouseLeave}
            className={styles.livingCardWrapper} 
            style={livingCardAnimation.style}
        >
            <Link href={`/games/${release.slug}`} className={`${styles.releaseCard} no-underline`} style={{transformStyle: 'preserve-3d'}}>
                {variant === 'kinetic' && (
                    <motion.div
                        className={styles.livingCardGlare}
                        style={{ opacity: glareOpacity, '--mouse-x': glareX, '--mouse-y': glareY } as any}
                    />
                )}
                <div className={styles.imageContainer} style={{ transform: 'translateZ(20px)' }}>
                    <Image
                        src={urlFor(release.mainImage).auto('format').url()}
                        alt={release.title}
                        fill
                        sizes="30vw"
                        className={styles.image}
                        placeholder="blur"
                        blurDataURL={release.mainImage.blurDataURL}
                    />
                    {new Date(release.releaseDate) < new Date() && <div className={styles.releasedBadge}><CheckIcon className={styles.checkIcon} /> صدرت</div>}
                </div>
                <div className={styles.cardContent} style={{ transform: 'translateZ(40px)' }}>
                    <div className={styles.cardHeader}>
                        <h4>{release.title}</h4>
                        <p>{formattedDate}</p>
                    </div>
                    <div className={styles.platformIcons}>
                        {(release.platforms || []).map(p => { const Icon = PlatformIcons[p]; return Icon ? <Icon key={p} className={styles.platformIcon} /> : null; })}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default memo(ReleaseCardComponent);