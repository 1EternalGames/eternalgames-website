// components/VanguardReviews/VanguardReviews.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useInView, animate, PanInfo, useMotionValue, useSpring, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { useVanguardCarousel } from '@/hooks/useVanguardCarousel';
import { urlFor } from '@/sanity/lib/image';
import type { SanityAuthor } from '@/types/sanity';
import type { CardProps } from '@/types';
import styles from './VanguardReviews.module.css';
import { sanityLoader } from '@/lib/sanity.loader';
import { usePerformanceStore } from '@/lib/performanceStore';
import { translateTag } from '@/lib/translations';
import { PenEdit02Icon, ColorPaletteIcon } from '@/components/icons/index';

// FIX: Added transitions for hidden state to ensure smooth exit
const creatorBubbleContainerVariants = {
    hidden: { opacity: 0, transition: { duration: 0.2, when: "afterChildren" } },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};
const creatorBubbleItemVariants = {
    hidden: { opacity: 0, x: 20, transition: { duration: 0.2 } },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } }
};

// --- CONFIGURATION ---
const SATELLITE_CONFIG = [
    { hoverX: -240, hoverY: -100, rotate: -12 }, // Top Left
    { hoverX: 180, hoverY: 60, rotate: 10 },    // Top Right
    { hoverX: -50, hoverY: -265, rotate: 5 }     // Upper Center (The "Upper Tag")
];

// --- POSITIONING ADJUSTMENTS ---
// ADJUST THESE NUMBERS TO LIFT/LOWER CARDS
const CARD_VERTICAL_OFFSET_DESKTOP = -80; 
const CARD_VERTICAL_OFFSET_MOBILE = -70;  

// --- MOBILE ADJUSTMENT NUMBER ---
const MOBILE_SATELLITE_SCALE = 0.45;

// --- ARROW POSITION SETTINGS ---
const ARROW_SETTINGS = {
    xOffset: -45, 
    yOffset: -10  
};

// --- ICONS ---
const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path d="M12.293 5.29273C12.6591 4.92662 13.2381 4.90402 13.6309 5.22437L13.707 5.29273L19.707 11.2927L19.7754 11.3689C20.0957 11.7617 20.0731 12.3407 19.707 12.7068L13.707 18.7068C13.3165 19.0973 12.6835 19.0973 12.293 18.7068C11.9025 18.3163 11.9025 17.6833 12.293 17.2927L16.5859 12.9998H5C4.44772 12.9998 4 12.552 4 11.9998C4 11.4475 4.44772 10.9998 5 10.9998H16.5859L12.293 6.7068L12.2246 6.63063C11.9043 6.23785 11.9269 5.65885 12.293 5.29273Z" fill="currentColor"></path>
    </svg>
);

// --- GLOBAL DEFINITIONS ---
const CARD_SHAPE_PATH = `
    M 20,0 
    L 280,0 Q 300,0 300,20 
    L 300,146 Q 300,150 297,152 L 293,154 Q 290,156 290,160 
    L 290,220 Q 290,224 293,226 L 297,228 Q 300,230 300,234 
    L 300,335 Q 300,345 292,352 
    L 272,372 Q 265,380 255,380 
    L 45,380 Q 35,380 28,372 
    L 8,352 Q 0,345 0,335 
    L 0,234 Q 0,230 3,228 L 7,226 Q 10,224 10,220 
    L 10,160 Q 10,156 7,154 L 3,152 Q 0,150 0,146 
    L 0,20 Q 0,0 20,0 Z
`;

const VanguardGlobalDefs = () => (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
             <filter id="vg-activeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
            <clipPath id="vg-cardClip" clipPathUnits="objectBoundingBox">
                 <path d={CARD_SHAPE_PATH} transform="scale(0.00333333, 0.00263158)" /> 
            </clipPath>
        </defs>
    </svg>
);

const VanguardCardFrame = ({ isActive, isEnabled }: { isActive: boolean, isEnabled: boolean }) => {
    if (!isEnabled) return null;

    const defaultTopLength = 0.13;  
    const defaultSideLength = 0.09; 
    const defaultOpacity = 0.6;
    
    const activeTopLength = 0.66; 
    const activeSideLength = 1.05;

    // --- ACTIVE PATHS (EXPANDING) ---
    const topWingPath = `
        M 0,20 
        Q 0,0 20,0 
        L 280,0 
        Q 300,0 300,20 
        L 300,146 Q 300,150 297,152 L 293,154 Q 290,156 290,160 
        L 290,220 Q 290,224 293,226 L 297,228 Q 300,230 300,234 
        L 300,335
    `;

    const leftWingPath = `
        M 0,20.1 
        L 0,146 Q 0,150 3,152 L 7,154 Q 10,156 10,160 
        L 10,220 Q 10,224 7,226 L 3,228 Q 0,230 0,234 
        L 0,335 Q 0,345 8,352 
        L 28,372 Q 35,380 45,380
        L 150,380
    `;

    // --- STATIC BOTTOM PATHS (RETREATING) ---
    const bottomRightPath = `
        M 150,380 
        L 255,380 Q 265,380 272,372 L 292,352 Q 300,345 300,335 
        L 300,234 Q 300,230 297,228 L 293,226 Q 290,224 290,220 
        L 290,130
    `;
    
    const bottomLeftPath = `
        M 150,380 
        L 45,380 Q 35,380 28,372 L 8,352 Q 0,345 0,335 
        L 0,234 Q 0,230 3,228 L 7,226 Q 10,224 10,220 
        L 10,130
    `;

    const activeStrokeThickness = "4"; 
    const staticStrokeThickness = "2"; 

    const activeTransition = {
        pathLength: { duration: 0.4, ease: "easeInOut" as const },
        opacity: { duration: 0.05 },
        filter: { duration: 0.05 }
    };
    
    const bottomTransition = {
        duration: 0.4,
        ease: "easeInOut" as const
    };

    return (
        <div className={styles.frameSvgContainer}>
            <svg className={styles.frameSvg} viewBox="0 0 300 380" preserveAspectRatio="none">
                <path d={CARD_SHAPE_PATH} 
                      fill="var(--bg-secondary)" stroke="none" strokeWidth="0" vectorEffect="non-scaling-stroke" />
                
                <motion.path 
                    d={bottomRightPath}
                    fill="none" 
                    stroke="var(--accent)" 
                    strokeWidth={staticStrokeThickness}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    filter="url(#vg-activeGlow)"
                    initial={{ pathLength: 1, opacity: 1 }}
                    animate={{ 
                        pathLength: isActive ? 0 : 1, 
                        opacity: isActive ? 0 : 1 
                    }}
                    transition={bottomTransition}
                />
                
                <motion.path 
                    d={bottomLeftPath}
                    fill="none" 
                    stroke="var(--accent)" 
                    strokeWidth={staticStrokeThickness}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    filter="url(#vg-activeGlow)"
                    initial={{ pathLength: 1, opacity: 1 }}
                    animate={{ 
                        pathLength: isActive ? 0 : 1, 
                        opacity: isActive ? 0 : 1 
                    }}
                    transition={bottomTransition}
                />

                {isEnabled && (
                    <>
                        <motion.path 
                            d={topWingPath}
                            fill="none" 
                            stroke="var(--accent)" 
                            strokeWidth={activeStrokeThickness}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            initial={{ pathLength: defaultTopLength, opacity: defaultOpacity }}
                            animate={{ 
                                pathLength: isActive ? activeTopLength : defaultTopLength, 
                                opacity: isActive ? 1 : defaultOpacity,
                                filter: isActive ? "url(#vg-activeGlow)" : "none"
                            }}
                            transition={activeTransition}
                        />

                        <motion.path 
                            d={leftWingPath}
                            fill="none" 
                            stroke="var(--accent)" 
                            strokeWidth={activeStrokeThickness}
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            initial={{ pathLength: defaultSideLength, opacity: defaultOpacity }}
                            animate={{ 
                                pathLength: isActive ? activeSideLength : defaultSideLength, 
                                opacity: isActive ? 1 : defaultOpacity,
                                filter: isActive ? "url(#vg-activeGlow)" : "none"
                            }}
                            transition={activeTransition}
                        />
                    </>
                )}
            </svg>
        </div>
    );
};

// --- ANIMATION VARIANTS FOR HOVER ---
const capsuleVariants: Variants = {
    idle: { x: 0, scale: 1 },
    hover: { 
        x: -10, 
        scale: 1.1,
        transition: { type: 'spring', stiffness: 400, damping: 15 }
    }
};

const arrowVariants: Variants = {
    idle: { opacity: 0, x: 10 },
    hover: { 
        opacity: 1, 
        x: 0,
        transition: { type: 'spring', stiffness: 400, damping: 15 }
    }
};

const CreatorCapsule = ({ label, creator }: { label: string, creator: SanityAuthor }) => {
    const handleBubbleClick = (e: React.MouseEvent) => { e.stopPropagation(); };
    const profileSlug = creator.username || (creator.slug as any)?.current || creator.name?.toLowerCase().replace(/\s+/g, '-');
    const hasPublicProfile = !!profileSlug;
    
    // Icon Selection based on role
    const IconComponent = label === 'تصميم' ? ColorPaletteIcon : PenEdit02Icon;

    // The inner pill content (Visuals)
    const InnerContent = (
        <>
             <div className={styles.capsuleIcon}>
                <IconComponent style={{ width: 14, height: 14 }} />
            </div>
            <span className={styles.creatorName}>{creator.name}</span>
        </>
    );
    
    // The interactive container
    const InteractiveWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div 
            className={styles.capsuleWrapper}
            initial="idle"
            whileHover="hover"
        >
            <motion.div 
                className={styles.capsuleArrow} 
                variants={arrowVariants}
                style={{ 
                    left: ARROW_SETTINGS.xOffset, 
                    marginTop: ARROW_SETTINGS.yOffset 
                }}
            >
                <ArrowIcon />
            </motion.div>
            
            <motion.div className={styles.creditCapsule} variants={capsuleVariants}>
                {children}
            </motion.div>
        </motion.div>
    );

    return (
        <motion.div variants={creatorBubbleItemVariants} className={styles.safeBridgeWrapper}>
            {hasPublicProfile ? (
                <Link href={`/creators/${profileSlug}`} onClick={handleBubbleClick} className="no-underline" prefetch={false}>
                    <InteractiveWrapper>
                        {InnerContent}
                    </InteractiveWrapper>
                </Link>
            ) : (
                <div title={`${creator.name}`}>
                     <InteractiveWrapper>
                        {InnerContent}
                    </InteractiveWrapper>
                </div>
            )}
        </motion.div>
    );
};

interface VanguardCardProps {
    review: CardProps;
    isCenter: boolean;
    isInView: boolean;
    isPriority: boolean;
    isMobile: boolean;
    isHovered: boolean;
    isInteractive: boolean;
    isVisible: boolean; 
    onHoverChange: (isHovering: boolean) => void;
}

const VanguardCard = memo(({ review, isCenter, isInView, isPriority, isMobile, isHovered, isInteractive, isVisible, onHoverChange }: VanguardCardProps) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard();
    const router = useRouter(); const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const layoutIdPrefix = "vanguard-reviews";
    const scoreRef = useRef<HTMLParagraphElement>(null);
    
    // Performance Store
    const { isFlyingTagsEnabled, isLivingCardEnabled, isCornerAnimationEnabled } = usePerformanceStore();
    const effectivelyDisabledLiving = !isLivingCardEnabled;

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 25 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 25 });

    useEffect(() => {
        if (isInView && isVisible && scoreRef.current && typeof review.score === 'number') {
            const controls = animate(0, review.score, {
                duration: 1.5, ease: [0.22, 1, 0.36, 1],
                onUpdate(value) { if (scoreRef.current) { scoreRef.current.textContent = value.toFixed(1); } }
            });
            return () => controls.stop();
        }
    }, [isInView, review.score, isVisible]);

    const linkPath = `/reviews/${review.slug}`;
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.ctrlKey || e.metaKey) return; 
        if ((e.target as HTMLElement).closest('a[href^="/creators"]')) {
            e.stopPropagation();
            return;
        }
        if ((e.target as HTMLElement).closest('a[href^="/tags/"]')) return;
        setPrefix(layoutIdPrefix);
    };
    
    // FIX: Bridge click handler to trigger main navigation
    const handleBridgeClick = (e: React.MouseEvent) => {
        // Only trigger if not clicking tags/creators (though they stopProp anyway)
        handleClick(e as any);
        router.push(linkPath);
    };
    
    const imageRef = review.mainImageVerticalRef || review.mainImageRef;
    const imageUrl = imageRef 
        ? urlFor(imageRef).width(isCenter ? 800 : 560).height(isCenter ? 1000 : 700).fit('crop').auto('format').url()
        : review.imageUrl;

    const showCredits = isCenter || isHovered;
    const displayTags = review.tags.slice(0, 3);
    
    // OPTIMIZATION: Disable interaction listeners if card is hidden
    const livingCardHandlers = (isInteractive && isVisible) ? {
        onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!effectivelyDisabledLiving) {
                livingCardAnimation.onMouseMove(e);
                const rect = e.currentTarget.getBoundingClientRect();
                mouseX.set(e.clientX - rect.left - 125); 
                mouseY.set(e.clientY - rect.top - 125);
            }
        },
        onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            if (!effectivelyDisabledLiving) livingCardAnimation.onTouchStart(e);
            onHoverChange(true);
        },
        onTouchEnd: () => {
            if (!effectivelyDisabledLiving) livingCardAnimation.onTouchEnd();
            onHoverChange(false);
        },
        onTouchCancel: () => {
             if (!effectivelyDisabledLiving) livingCardAnimation.onTouchCancel();
             onHoverChange(false);
        },
        onTouchMove: !effectivelyDisabledLiving ? livingCardAnimation.onTouchMove : undefined,
        onMouseEnter: () => { 
            if (!effectivelyDisabledLiving) livingCardAnimation.onMouseEnter(); 
            onHoverChange(true); 
        },
        onMouseLeave: () => { 
            if (!effectivelyDisabledLiving) livingCardAnimation.onMouseLeave(); 
            onHoverChange(false); 
        },
    } : {};
    
    const animationStyles = !effectivelyDisabledLiving ? livingCardAnimation.style : {};

    return (
        <div className={styles.cardWrapper}>
            <Link 
                href={linkPath}
                onClick={handleClick}
                className="no-underline"
                style={{ display: 'block', height: '100%', cursor: 'pointer' }}
                prefetch={false}
                scroll={false} 
            >
                <motion.div
                    ref={livingCardRef}
                    {...livingCardHandlers}
                    style={{ 
                        ...animationStyles, 
                        transformStyle: 'preserve-3d', 
                        height: '100%',
                        background: 'transparent',
                        boxShadow: 'none',
                        backgroundColor: 'transparent'
                    }}
                    layoutId={`${layoutIdPrefix}-card-container-${review.legacyId}`} 
                    className={styles.vanguardCard}
                >
                    {/* 
                       THE HIT LAYER:
                       This invisible div covers the entire card and uses the same clip-path 
                       to ensure the shape is respected. It catches mouse events that fall 
                       through other transparent layers (like the top half of the card).
                    */}
                    <div 
                        className={styles.hitArea}
                    />

                    {/* OPTIMIZATION: Only render expensive SVG frame if visible */}
                    {isVisible && <VanguardCardFrame isActive={isHovered} isEnabled={isCornerAnimationEnabled} />}
                    
                    <div className={styles.effectLayer}>
                        {/* OPTIMIZATION: Only render spotlight/scanline if visible */}
                        {isVisible && !isMobile && (
                            <motion.div 
                                className={styles.holoSpotlight} 
                                style={{ x: smoothMouseX, y: smoothMouseY }} 
                            />
                        )}
                        {isVisible && <div className={styles.scanLine} />}
                    </div>

                    <AnimatePresence>
                        {isVisible && showCredits && (
                            <motion.div
                                className={styles.creatorCapsuleContainer}
                                variants={creatorBubbleContainerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                style={{ pointerEvents: 'auto', transform: 'translateZ(50px)' }}
                            >
                                {/* Safe Bridge overlay now handled in CSS via creatorCapsuleContainer::before */}
                                {review.authors.map(author => <CreatorCapsule key={author._id} label="بقلم" creator={author} />)}
                                {review.designers?.map(designer => <CreatorCapsule key={designer._id} label="تصميم" creator={designer} />)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {typeof review.score === 'number' && (<div className={styles.vanguardScoreBadge}><p ref={scoreRef} style={{ margin: 0 }}>0.0</p></div>)}
                    
                    <motion.div layoutId={`${layoutIdPrefix}-card-image-${review.legacyId}`} className={styles.cardImageContainer}>
                        <Image 
                            loader={sanityLoader}
                            src={imageUrl} 
                            alt={review.title} 
                            fill 
                            sizes={isCenter ? "(max-width: 768px) 80vw, 400px" : "(max-width: 768px) 60vw, 280px"}
                            className={styles.cardImage} 
                            placeholder="blur" 
                            blurDataURL={review.blurDataURL} 
                            priority={isPriority}
                        />
                    </motion.div>
                    
                    <motion.div className={styles.cardContent} animate={{ background: isCenter ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} transition={{ duration: 0.5, ease: 'circOut' }}>
                        <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${review.legacyId}`}>{review.title}</motion.h3>
                        
                        <div className={styles.cardMetaRow}>
                            {review.date && <p className={styles.cardDate}>{review.date.split(' - ')[0]}</p>}
                            <div className={styles.techDecoration}>
                                <div className={styles.techDot} />
                                <div className={styles.techDot} />
                                <div className={styles.techDot} />
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* OPTIMIZATION: Only render flying tags if visible */}
                    {isVisible && isFlyingTagsEnabled && (
                        <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                            <AnimatePresence>
                                {isHovered && displayTags.map((tag, i) => {
                                    // Calculate config based on device
                                    const rawConfig = SATELLITE_CONFIG[i];
                                    
                                    // Apply mobile scaling if needed
                                    const hoverX = isMobile && rawConfig ? rawConfig.hoverX * MOBILE_SATELLITE_SCALE : (rawConfig?.hoverX || 0);
                                    const hoverY = isMobile && rawConfig ? rawConfig.hoverY * MOBILE_SATELLITE_SCALE : (rawConfig?.hoverY || 0);
                                    const rotate = rawConfig?.rotate || 0;

                                    return (
                                        <motion.div
                                            key={`${review.id}-${tag.slug}`}
                                            className={styles.satelliteShard}
                                            initial={{ opacity: 0, scale: 0, x: 0, y: 0, z: 0 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1.15,
                                                x: hoverX,
                                                y: hoverY,
                                                rotate: rotate,
                                                z: -30 
                                            }}
                                            // FIX: Added smooth exit transition
                                            exit={{ 
                                                opacity: 0, 
                                                scale: 0.4, 
                                                x: 0, 
                                                y: 0, 
                                                rotate: 0,
                                                z: 0 
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 180,
                                                damping: 20,
                                                delay: i * 0.05
                                            }}
                                            style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d' }}
                                            onClick={(e) => e.stopPropagation()}
                                         >
                                             <Link 
                                                href={`/tags/${tag.slug}`} 
                                                onClick={(e) => e.stopPropagation()}
                                                className={`${styles.satelliteShardLink} no-underline`} 
                                                prefetch={false}
                                            >
                                                 {translateTag(tag.title)}
                                             </Link>
                                         </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            
                            {/* --- SAFE BRIDGES --- */}
                            {/* Invisible lines that ensure hover state persists when moving mouse from center to tags */}
                            {isHovered && (
                                <svg className={styles.satelliteBridgeSvg}>
                                    {displayTags.map((_, i) => {
                                        // Re-calculate same coordinates for bridge
                                        const rawConfig = SATELLITE_CONFIG[i];
                                        const hoverX = isMobile && rawConfig ? rawConfig.hoverX * MOBILE_SATELLITE_SCALE : (rawConfig?.hoverX || 0);
                                        const hoverY = isMobile && rawConfig ? rawConfig.hoverY * MOBILE_SATELLITE_SCALE : (rawConfig?.hoverY || 0);

                                        return (
                                            <line 
                                                key={`bridge-${i}`}
                                                x1="0" y1="0" 
                                                x2={hoverX} 
                                                y2={hoverY} 
                                                className={styles.satelliteBridgeLine}
                                                // FIX: Added onClick to bridge lines to ensure they act as part of the card
                                                onClick={handleBridgeClick}
                                            />
                                        );
                                    })}
                                </svg>
                            )}
                        </div>
                    )}

                </motion.div>
            </Link>
        </div>
    );
});
VanguardCard.displayName = "VanguardCard";

const KineticNavigator = ({ reviews, currentIndex, navigateToIndex }: { reviews: CardProps[], currentIndex: number, navigateToIndex: (index: number) => void }) => {
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const activeItem = itemRefs.current[currentIndex];
        const track = trackRef.current;

        if (activeItem && track) {
            // Replaced scrollIntoView with manual container scrolling to prevent window scroll jumping
            const itemRect = activeItem.getBoundingClientRect();
            const trackRect = track.getBoundingClientRect();
            
            // Calculate position relative to the track's current scroll view
            // itemRect.left is relative to viewport. trackRect.left is relative to viewport.
            // relativeLeft is the pixel distance from the left edge of the visible track area.
            // Add track.scrollLeft to get the position relative to the start of the scrollable content.
            const relativeLeft = itemRect.left - trackRect.left + track.scrollLeft;
            
            // Center the item: targetScrollLeft = itemCenter - trackHalfWidth
            const targetScrollLeft = relativeLeft - (trackRect.width / 2) + (itemRect.width / 2);

            track.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

    return (
        <div className={styles.kineticNavigator}>
            <div className={styles.navTrack} ref={trackRef}>
                {reviews.map((review, index) => {
                    const isActive = currentIndex === index;
                    return (
                        <motion.button 
                            key={review.id} 
                            ref={el => { itemRefs.current[index] = el }} 
                            className={styles.navItem} 
                            data-active={isActive} 
                            onTap={() => navigateToIndex(index)}
                            whileTap={{ scale: 0.95 }}
                            initial={{ scale: 1 }}
                            animate={{ scale: isActive ? 1.2 : 1 }} 
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ width: 60, height: 40, transformOrigin: 'center' }}
                        >
                            <Image 
                                loader={sanityLoader}
                                src={`${review.imageUrl.split('?')[0]}?w=200&auto=format`} 
                                alt={review.title} 
                                fill 
                                sizes="10vw" 
                                className={styles.navImage} 
                                unoptimized 
                            />
                            <AnimatePresence>{isActive && <motion.div className={styles.navTitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{review.title}</motion.div>}</AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default function VanguardReviews({ reviews }: { reviews: CardProps[] }) {
    const containerRef = useRef(null);
    const hasAnimatedIn = useInView(containerRef, { once: true, amount: 0.1 });
    const isCurrentlyInView = useInView(containerRef, { amount: 0.4 });
    const [initialAnimHasRun, setInitialAnimHasRun] = useState(false);
    const [isManualHover, setIsManualHover] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        currentIndex,
        hoveredId,
        setHoveredId,
        navigateToIndex,
        getCardState,
        isMobile,
        isAnimating
    } = useVanguardCarousel(reviews.length, isCurrentlyInView);

    useEffect(() => {
        if (hasAnimatedIn && !initialAnimHasRun) {
            const timer = setTimeout(() => setInitialAnimHasRun(true), 800);
            return () => clearTimeout(timer);
        }
    }, [hasAnimatedIn, initialAnimHasRun]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            navigateToIndex((currentIndex + 1) % reviews.length);
        } else if (info.offset.x > swipeThreshold) {
            navigateToIndex((currentIndex - 1 + reviews.length) % reviews.length);
        }
    };
    
    // --- DEBOUNCED HOVER LOGIC ---
    // MEMOIZED to prevent unnecessary re-renders of VanguardCard
    const handleCardHoverChange = useCallback((id: string, isHovering: boolean) => {
        if (!initialAnimHasRun) return;

        // CRITICAL FIX: Ensure we don't apply hover effects if the carousel is actively animating
        // This prevents the "stuck large card" issue during rapid interaction
        if (isAnimating) {
            setHoveredId(null);
            setIsManualHover(false);
            return;
        }

        // NEW: Instant update for mobile to prevent laggy touch feedback
        if (isMobile) {
            if (isHovering) {
                setHoveredId(id);
                setIsManualHover(true);
            } else {
                setHoveredId(null);
                setIsManualHover(false);
            }
            return;
        }

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        if (isHovering) {
            // ENTER: Wait 50ms (snappy debounce)
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredId(id);
                setIsManualHover(true);
            }, 50);
        } else {
            // LEAVE: Wait 50ms before clearing
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredId(null);
                setIsManualHover(false);
            }, 50);
        }
    }, [initialAnimHasRun, isMobile, setHoveredId, isAnimating]);

    if (reviews.length === 0) return null;

    const centerCardState = getCardState(currentIndex, reviews[currentIndex].id);
    const centerStyle = centerCardState.style;
    const initialAnimationConfig = {
        ...centerStyle,
        opacity: 0,
        transform: centerStyle.transform ? centerStyle.transform.replace(/scale\([0-9.]+\)/, 'scale(0.8)') : 'scale(0.8)',
    };


    return (
        <div 
            ref={containerRef} 
            className={`${styles.vanguardContainer} ${isManualHover ? styles['manual-hover'] : ''} gpu-cull`}
        >
            {/* Global Definitions for Clip Paths */}
            <VanguardGlobalDefs />

            <motion.div className={styles.spotlightGlow} animate={{ opacity: hoveredId ? 0.5 : 1 }} />
            
            <motion.div
                style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                onTouchEnd={() => initialAnimHasRun && setHoveredId(null)}
                onTouchCancel={() => initialAnimHasRun && setHoveredId(null)}
            >
                {reviews.map((review, reviewIndex) => {
                    const { style, isCenter, isVisible } = getCardState(reviewIndex, review.id);
                    const isHovered = hoveredId === review.id;
                    
                    // --- APPLY LIFT ADJUSTMENTS HERE ---
                    const currentStyle = { ...style };
                    if (currentStyle.transform) {
                        // NOTE: The previous refactoring of getCardState in `useVanguardCarousel` logic handles standard placement.
                        // However, since we defined constants here, let's override the Y-translation manually for fine control.
                        
                        // Parse existing transform to preserve X and Scale
                        // Format: translateX(...) scale(...) translateY(...)
                        // We replace the translateY part.
                        
                        let yOffset = isMobile ? CARD_VERTICAL_OFFSET_MOBILE : CARD_VERTICAL_OFFSET_DESKTOP;
                        
                        if (isHovered && !isMobile) {
                            yOffset -= 15; // Additional lift for hover
                        }
                        
                        // Replace the translateY(...) part of the string
                        // Regex looks for translateY followed by anything until closing parenthesis
                        currentStyle.transform = currentStyle.transform.replace(/translateY\([^)]+\)/, `translateY(${yOffset}px)`);
                    }

                    return (
                        <motion.div 
                            key={review.id} 
                            className={`${styles.cardSlot} ${isHovered ? styles.activeState : ''}`} 
                            initial={!initialAnimHasRun ? initialAnimationConfig : false}
                            animate={currentStyle}
                            transition={{
                                ease: [0.4, 0, 0.2, 1],
                                duration: 0.7,
                                delay: !initialAnimHasRun ? (isCenter ? 0 : 0.2) : 0,
                            }}
                        >
                            <VanguardCard 
                                review={review} 
                                isCenter={isCenter} 
                                isInView={hasAnimatedIn}
                                isPriority={isCenter}
                                isMobile={isMobile}
                                isHovered={isHovered}
                                isInteractive={initialAnimHasRun}
                                isVisible={isVisible} // OPTIMIZATION: Pass visibility to card
                                onHoverChange={(val) => handleCardHoverChange(review.id, val)}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
            
            {hasAnimatedIn && <KineticNavigator reviews={reviews} currentIndex={currentIndex} navigateToIndex={navigateToIndex} />}
        </div>
    );
}