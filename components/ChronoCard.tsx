// components/ChronoCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { SanityGameRelease } from '@/types/sanity';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { memo } from 'react';
import { useLivingCard } from '@/hooks/useLivingCard';

// --- DEFINITIVE FIX: ADDED imports for centralized icons ---
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

// --- DEFINITIVE FIX: Replaced inline SVGs with imported components ---
const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'PC': PCIcon,
  'PS5': PS5Icon,
  'Xbox': XboxIcon,
  'Switch': SwitchIcon,
};

const ChronoCardComponent = ({ release }: { release: SanityGameRelease }) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 150, mass: 0.7 });
    const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 150, mass: 0.7 });
    const glareX = useTransform(smoothMouseX, [0, 1], ['0%', '100%']);
    const glareY = useTransform(smoothMouseY, [0, 1], ['0%', '100%']);
    const glareOpacity = useTransform(smoothMouseX, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        livingCardAnimation.onMouseMove(e);
        if (!livingCardRef.current) return;
        const { left, top, width, height } = livingCardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const handleMouseLeave = () => {
        livingCardAnimation.onHoverEnd();
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const formattedDate = new Date(release.releaseDate).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
    }'numeric');
  
    const layoutIdPrefix = "releases-grid";
    const contentId = release.legacyId || release._id;

    return (
        <motion.div
            ref={livingCardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={livingCardAnimation.onHoverStart}
            onMouseLeave={handleMouseLeave}
            className="living-card-wrapper"
            style={livingCardAnimation.style}
        >
            <Link href={`/games/${release.slug}`} className="chrono-card-link no-underline" scroll={false}>
                <motion.div
                    layoutId={`${layoutIdPrefix}-card-container-${contentId}`}
                    className="chrono-card living-card"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: 'translateZ(0px)',
                    }}
                >
                    <motion.div
                        className="living-card-glare"
                        style={{
                            opacity: glareOpacity,
                            '--mouse-x': glareX,
                            '--mouse-y': glareY,
                            borderRadius: '12px',
                        }}
                    />
          
                    <motion.div 
                        className="chrono-card-image-container"
                        layoutId={`${layoutIdPrefix}-card-image-${contentId}`}
                        style={{ transform: 'translateZ(20px)' }}
                    >
                        <Image
                            src={release.mainImage.url}
                            alt={release.title}
                            fill
                            sizes="(max-width: 768px) 90vw, 320px"
                            className="chrono-card-image"
                            placeholder="blur"
                            blurDataURL={release.mainImage.blurDataURL}
                        />
                        <div className="chrono-card-synopsis">
                            <p>{release.synopsis}</p>
                        </div>
                    </motion.div>
          
                    <motion.div className="chrono-card-content" style={{ transform: 'translateZ(20px)' }}>
                        <div className="chrono-card-header">
                            <motion.h3 
                                className="chrono-card-title"
                                layoutId={`${layoutIdPrefix}-card-title-${contentId}`}
                            >
                                {release.title}
                            </motion.h3>
                            <p className="chrono-card-date">{formattedDate}</p>
                        </div>
                        <div className="chrono-card-platforms">
                            {(release.platforms || []).map(p => {
                                const Icon = PlatformIcons[p];
                                return Icon ? <Icon key={p} className="platform-icon" title={p} /> : null;
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            </Link>
        </motion.div>
    );
}

export default memo(ChronoCardComponent);


