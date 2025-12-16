// components/TimelineCard.tsx
'use client';

import React, { memo, useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SanityGameRelease } from '@/types/sanity';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, Transition } from 'framer-motion';
import { useLivingCard } from '@/hooks/useLivingCard';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { sanityLoader } from '@/lib/sanity.loader';
import { urlFor } from '@/sanity/lib/image';
import { useUserStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { useClickOutside } from '@/hooks/useClickOutside'; 
import AdminPinButton from '@/components/releases/AdminPinButton';
import ActionButton from './ActionButton';

// Icons
import { Calendar03Icon } from '@/components/icons';
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

import styles from './TimelineCard.module.css';

// --- GLOBAL TAG SCALES ---
const DESKTOP_TAG_SCALE = 0.8; 
const MOBILE_TAG_SCALE = 0.8; 

// --- ICONS ---
const YoutubeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const AddToListStrokeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 9V20C3.5 21.1046 4.39543 22 5.5 22H18.5C19.6046 22 20.5 21.1046 20.5 20V4C20.5 2.89543 19.6046 2 18.5 2H12"></path>
        <path d="M13.5 17H17.5"></path>
        <path d="M13.5 7H17.5"></path>
        <path d="M13.5 12H17.5"></path>
        <path d="M6.5 16.5L8 18L11 14"></path>
        <path d="M10 5H3.5M10 5L7.08333 2M10 5L7.08333 8"></path>
    </svg>
);

const AddToListSolidIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M8.05033 1.55292C7.66534 1.15694 7.03224 1.14802 6.63626 1.53301C6.24027 1.91799 6.23135 2.55109 6.61634 2.94708L7.88307 4.25H3.75C3.19772 4.25 2.75 4.69772 2.75 5.25C2.75 5.80229 3.19772 6.25 3.75 6.25H7.88307L6.61634 7.55292C6.23135 7.94891 6.24027 8.58201 6.63625 8.967C7.03224 9.35198 7.66534 9.34306 8.05033 8.94708L10.967 5.94708C11.3443 5.55896 11.3443 4.94104 10.967 4.55292L8.05033 1.55292ZM2.75 20V7.5H5.21144C4.92844 8.30226 5.11492 9.23131 5.76491 9.86324C6.65587 10.7295 8.08035 10.7094 8.94657 9.81843L11.8632 6.81843C12.7123 5.94516 12.7123 4.55485 11.8632 3.68158L9.49921 1.25H18.5C20.0188 1.25 21.25 2.48122 21.25 4V20C21.25 21.5188 20.0188 22.75 18.5 22.75H5.5C3.98122 22.75 2.75 21.5188 2.75 20ZM13.5 16.25C13.0858 16.25 12.75 16.5858 12.75 17C12.75 17.4142 13.0858 17.75 13.5 17.75H17.5C17.9142 17.75 18.25 17.4142 18.25 17C18.25 16.5858 17.9142 16.25 17.5 16.25H13.5ZM12.75 7C12.75 6.58579 13.0858 6.25 13.5 6.25H17.5C17.9142 6.25 18.25 6.58579 18.25 7C18.25 7.41421 17.9142 7.75 17.5 7.75H13.5C13.0858 7.75 12.75 7.41421 12.75 7ZM13.5 11.25C13.0858 11.25 12.75 11.5858 12.75 12C12.75 12.4142 13.0858 12.75 13.5 12.75H17.5C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25H13.5ZM11.45 13.4C11.7814 13.6486 11.8485 14.1187 11.6 14.45L8.6 18.45C8.46955 18.624 8.27004 18.7327 8.05317 18.7482C7.8363 18.7636 7.62341 18.6841 7.46967 18.5304L5.96967 17.0304C5.67678 16.7375 5.67678 16.2626 5.96967 15.9697C6.26256 15.6768 6.73744 15.6768 7.03033 15.9697L7.91885 16.8582L10.4 13.55C10.6485 13.2187 11.1186 13.1515 11.45 13.4Z" fill="currentColor"></path>
    </svg>
);

// --- CONFIGURATION FOR FLYING PLATFORM TAGS (Right Side) ---
const PLATFORM_FLY_CONFIG = {
    LEFT_ANCHOR: '80%', 
    TARGET_BOTTOM: 280, 
    BOTTOM_STEP: -33,   
    BASE_ROT: -5,     
    ROT_STEP: 0    
};
// MOBILE: Platforms on bottom-right of image (Image height ~200px)
const MOBILE_PLATFORM_FLY_CONFIG = {
    LEFT_ANCHOR: '75%',
    TARGET_BOTTOM: 290, // Bottom edge of image
    BOTTOM_STEP: 35, // Stack upwards
    BASE_ROT: 0,
    ROT_STEP: 0
};

// --- CONFIGURATION FOR SUBSCRIPTION TAGS (Left Side) ---
const SUB_FLY_CONFIG = {
    TARGET_RIGHT_PCT: 80, 
    RIGHT_STEP: 2,       
    TARGET_BOTTOM: 210,
    BOTTOM_STEP: 33,
    BASE_ROT: 5, 
    ROT_STEP: 0
};
// MOBILE: Subscriptions on bottom-left of image
// Modified to use LEFT alignment for vertical stacking of icons
const MOBILE_SUB_FLY_CONFIG = {
    TARGET_LEFT: 15, // Fixed pixel distance from left edge
    TARGET_BOTTOM: 203, // Bottom edge of image
    BOTTOM_STEP: 28, // Stack upwards
    BASE_ROT: 0,
    ROT_STEP: 0
};

// --- CONFIGURATION FOR STATUS/COUNTDOWN (Bottom Center) ---
const STATUS_FLY_CONFIG = { X: 0, Y: 140, ROT: -3 };
// MOBILE: Center of card (below image)
const MOBILE_STATUS_FLY_CONFIG = { X: 0, Y: 100, ROT: 0 };

// --- CONFIGURATION FOR PRICE (Top Right) ---
const PRICE_FLY_CONFIG = { 
    X: -200, 
    Y: -80, 
    ROT: 5 
};
// MOBILE: Stacked above subscriptions on bottom-left
const MOBILE_PRICE_FLY_CONFIG = { 
    X: -160, // Left side
    Y: -80, // Above subs
    ROT: 0
};

// --- CONFIGURATION FOR DEVELOPER (Top Left - Primary Position) ---
const PRIMARY_HEAD_CONFIG = { 
    LEFT_ANCHOR: 200, 
    TARGET_BOTTOM: 380, 
    BASE_ROT: 0
};
// MOBILE: Top-left of image
const MOBILE_PRIMARY_HEAD_CONFIG = { 
    LEFT_ANCHOR: 166, 
    TARGET_BOTTOM: 360, // Top of image
    BASE_ROT: 0
};

// --- CONFIGURATION FOR PUBLISHER (Top Left - Secondary Position) ---
const SECONDARY_HEAD_CONFIG = { 
    LEFT_ANCHOR: 70, 
    TARGET_BOTTOM: 380, 
    BASE_ROT: 0
};
// MOBILE: Below developer at top-left
const MOBILE_SECONDARY_HEAD_CONFIG = { 
    LEFT_ANCHOR: 60, 
    TARGET_BOTTOM: 360, 
    BASE_ROT: 0
};

// --- CONFIGURATION FOR PLAY BUTTON (Centered on Image) ---
const PLAY_BUTTON_CONFIG = {
    OFFSET_X: 0,   // Center relative
    OFFSET_Y: 70,   // Center relative
    ROTATE: 0,
    INITIAL_SCALE: 1
};

export const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'PC': PCIcon,
    'PlayStation': PS5Icon,
    'Xbox': XboxIcon,
    'Switch': SwitchIcon,
};

export const PlatformNames: Record<string, string> = {
    'PC': 'PC',
    'PlayStation': 'PS5',
    'Xbox': 'Xbox',
    'Switch': 'Switch',
};

const PLATFORM_SORT_WEIGHTS: Record<string, number> = {
    'Switch': 4,
    'Xbox': 3,
    'PlayStation': 2,
    'PC': 1,
};

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg> );
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> );

// Smoother/Slower spring for floating animation
const morphTransition: Transition = {
    type: "spring",
    stiffness: 120, 
    damping: 20,
    mass: 1.0
};

const TimelineCardComponent = ({ 
    release, 
    autoHeight = false,
    showAdminControls = false
}: { 
    release: SanityGameRelease & { game?: { slug?: string, title?: string }, tags?: any[], onGamePass?: boolean, onPSPlus?: boolean },
    autoHeight?: boolean,
    showAdminControls?: boolean
}) => {
    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const { data: session } = useSession();
    const { toggleBookmark, bookmarks, setSignInModalOpen } = useUserStore();
    
    const [isHovered, setIsHovered] = useState(false);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Timer ref for delaying hover state on touch
    const videoRef = useRef<HTMLIFrameElement>(null);
    
    // Track whether the next click should be blocked (because it was just used to 'wake' the card)
    const blockNextClickRef = useRef(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
        setIsMobile(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Hook to close the card if clicking outside on mobile
    useClickOutside(livingCardRef, () => {
        if (isMobile) {
            setIsHovered(false);
            blockNextClickRef.current = false;
        }
    });

    const activeTagScale = isMobile ? MOBILE_TAG_SCALE : DESKTOP_TAG_SCALE;

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 150 });
    const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 150 });
    const glareX = useTransform(smoothMouseX, [0, 1], ['0%', '100%']);
    const glareY = useTransform(smoothMouseY, [0, 1], ['0%', '100%']);

    // --- MOUSE HANDLERS (Desktop) ---
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMobile) return; 
        livingCardAnimation.onMouseMove(e);
        if (!livingCardRef.current) return;
        const { left, top, width, height } = livingCardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        livingCardAnimation.onMouseLeave();
        setIsHovered(false);
        // Don't stop video on leave to allow viewing without hover if clicked
        mouseX.set(0.5); mouseY.set(0.5);
    };
    
    const handleMouseEnter = () => {
        if (isMobile) return;
        livingCardAnimation.onMouseEnter();
        setIsHovered(true);
    };

    // --- TOUCH HANDLERS (Mobile) ---
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        // Immediate Wake-up on touch
        livingCardAnimation.onTouchStart(e);
        
        if (!isHovered) {
            // First tap: Just Wake Up
            setIsHovered(true);
            blockNextClickRef.current = true;
        } else {
            // Already Woken: Allow normal click behavior (handled in handleClick)
            blockNextClickRef.current = false;
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        // Just pass movement to tilt logic
        livingCardAnimation.onTouchMove(e);
    };

    const handleTouchEnd = () => {
        livingCardAnimation.onTouchEnd();
        // Do NOT set isHovered(false) here to allow buttons to be pressed
        // We rely on useClickOutside to close it or navigation to unmount it
    };

    const toggleWishlist = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stops tilt effect and navigation
        if (!session) {
            setSignInModalOpen(true);
            return;
        }
        toggleBookmark(release.legacyId, 'release'); 
    };
    
    // Admin Pin Toggle needs similar stopPropagation
    const handleAdminPinToggle = (e: React.MouseEvent | React.TouchEvent) => {
        // The AdminPinButton component handles the logic, but we need to ensure
        // the click doesn't bubble up to the card wrapper here.
        // Since AdminPinButton is a child, we wrap it in a div that stops propagation.
    };

    const isBookmarked = bookmarks.includes(`release-${release.legacyId}`);

    const trailerId = useMemo(() => {
        if (!release.trailer) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = release.trailer.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }, [release.trailer]);

    const handleWatchClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stops link navigation & tilt
        setIsVideoActive(true);
    };

    const handleCloseVideo = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVideoActive(false);
    };

    const releaseDate = new Date(release.releaseDate);
    const isReleased = releaseDate < new Date();
    const isTBA = release.isTBA;

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const formattedDate = isTBA ? "TBA" : `${releaseDate.getDate()} ${arabicMonths[releaseDate.getMonth()]} ${releaseDate.getFullYear()}`;
    const gameLink = release.game?.slug ? `/games/${release.game.slug}` : null;
    const mainHref = gameLink || '/releases'; 
    const layoutIdPrefix = `timeline-${release._id}`;
    
    const platforms = useMemo(() => {
        const raw = release.platforms || [];
        const normalizedSet = new Set<string>();
        raw.forEach(p => {
            if (p === 'PlayStation 5') normalizedSet.add('PlayStation');
            else normalizedSet.add(p);
        });
        return Array.from(normalizedSet);
    }, [release.platforms]);

    const handleClick = (e: React.MouseEvent) => {
        // If mobile and this click was used to 'wake' the card, stop navigation
        if (isMobile && blockNextClickRef.current) {
            e.preventDefault();
            blockNextClickRef.current = false;
            return;
        }

        if (!gameLink || isVideoActive) return; 
        setPrefix(layoutIdPrefix);
    };

    const imageUrl = release.mainImage 
        ? urlFor(release.mainImage).width(800).height(450).fit('crop').auto('format').url()
        : '/placeholder-game.jpg';
    
    const blurDataURL = release.mainImage?.blurDataURL;

    // --- Flying Satellites (Price, Status) ---
    const flyingItems = useMemo(() => {
        const satellites = [];
        
        // Select config based on device
        const STATUS_CFG = isMobile ? MOBILE_STATUS_FLY_CONFIG : STATUS_FLY_CONFIG;
        const PRICE_CFG = isMobile ? MOBILE_PRICE_FLY_CONFIG : PRICE_FLY_CONFIG;

        // 1. Countdown
        if (!isReleased && !isTBA) {
             const msPerDay = 1000 * 60 * 60 * 24;
             const daysLeft = Math.ceil((releaseDate.getTime() - new Date().getTime()) / msPerDay);
             
             let label = `باقي ${daysLeft} يوم`;
             let colorClass = "cyan";
             if (daysLeft <= 3) colorClass = "golden";
             else if (daysLeft <= 10) colorClass = "red";
             else if (daysLeft <= 20) colorClass = "orange";

             satellites.push({
                 type: 'status', label: label, colorClass: colorClass,
                 x: STATUS_CFG.X, y: STATUS_CFG.Y, rotate: STATUS_CFG.ROT,
                 anchor: 'center', link: null
             });
        }

        // 2. PRICE (Top Right)
        if (release.price) {
            satellites.push({
                type: 'price', label: release.price,
                x: PRICE_CFG.X, y: PRICE_CFG.Y, rotate: PRICE_CFG.ROT,
                anchor: 'left', link: null, colorClass: 'pricePill'
            });
        }
        
        return satellites;
    }, [isReleased, isTBA, releaseDate, release.price, isMobile]);

    // --- Flying Platforms (Right Side) ---
    const platformConfig = useMemo(() => {
        const validPlatforms = platforms.filter(p => PlatformIcons[p]);
        validPlatforms.sort((a, b) => {
            const weightA = PLATFORM_SORT_WEIGHTS[a] || 0;
            const weightB = PLATFORM_SORT_WEIGHTS[b] || 0;
            return weightB - weightA; 
        });
        
        const CFG = isMobile ? MOBILE_PLATFORM_FLY_CONFIG : PLATFORM_FLY_CONFIG;

        return validPlatforms.map((p, i) => {
            const Icon = PlatformIcons[p];
            // On Mobile we stack upwards from bottom-right (inside image)
            // On Desktop we stack upwards from 280 (outside image)
            const bottom = CFG.TARGET_BOTTOM + (i * CFG.BOTTOM_STEP * (isMobile ? 1 : 1)); // Step is negative on desktop
            
            return {
                key: p,
                name: PlatformNames[p] || p,
                Icon: Icon,
                left: CFG.LEFT_ANCHOR, 
                bottom, 
                rotate: CFG.BASE_ROT
            };
        });
    }, [platforms, isMobile]);

    // --- Developer & Publisher (Left Side - Aligned Left) ---
    const devPubConfig = useMemo(() => {
        const items = [];
        let hasDev = release.developer && release.developer.title;
        
        const PRIMARY = isMobile ? MOBILE_PRIMARY_HEAD_CONFIG : PRIMARY_HEAD_CONFIG;
        const SECONDARY = isMobile ? MOBILE_SECONDARY_HEAD_CONFIG : SECONDARY_HEAD_CONFIG;

        if (hasDev) {
            items.push({
                key: 'dev',
                label: release.developer!.title,
                link: `/developers/${release.developer!.slug}`,
                left: PRIMARY.LEFT_ANCHOR,
                bottom: PRIMARY.TARGET_BOTTOM,
                rotate: PRIMARY.BASE_ROT,
                colorClass: 'devPill'
            });
        }

        if (release.publisher && release.publisher.title) {
            const config = hasDev ? SECONDARY : PRIMARY;
            items.push({
                key: 'pub',
                label: release.publisher.title,
                link: `/publishers/${release.publisher.slug}`,
                left: config.LEFT_ANCHOR,
                bottom: config.TARGET_BOTTOM,
                rotate: config.BASE_ROT,
                colorClass: 'devPill'
            });
        }
        return items;
    }, [release.developer, release.publisher, isMobile]);

    // --- Flying Subscription Tags (Left Side - Replaces Genres) ---
    const subConfig = useMemo(() => {
        const items = [];
        let index = 0;
        
        // Select config based on device
        if (release.onGamePass) {
            let left: string | number | undefined;
            let right: string | number | undefined = undefined;
            let bottom: number;
            let rotate: number;

            if (isMobile) {
                // Mobile: Align LEFT using fixed pixels
                left = MOBILE_SUB_FLY_CONFIG.TARGET_LEFT;
                bottom = MOBILE_SUB_FLY_CONFIG.TARGET_BOTTOM + (index * MOBILE_SUB_FLY_CONFIG.BOTTOM_STEP);
                rotate = MOBILE_SUB_FLY_CONFIG.BASE_ROT + (index * MOBILE_SUB_FLY_CONFIG.ROT_STEP);
            } else {
                // Desktop: Align RIGHT using percentages
                const rightPct = SUB_FLY_CONFIG.TARGET_RIGHT_PCT + (index * SUB_FLY_CONFIG.RIGHT_STEP);
                right = `${rightPct}%`;
                bottom = SUB_FLY_CONFIG.TARGET_BOTTOM + (index * SUB_FLY_CONFIG.BOTTOM_STEP);
                rotate = SUB_FLY_CONFIG.BASE_ROT + (index * SUB_FLY_CONFIG.ROT_STEP);
            }

            items.push({
                key: 'gp',
                name: 'Game Pass',
                Icon: XboxIcon,
                left, right, bottom, rotate
            });
            index++;
        }

        if (release.onPSPlus) {
            let left: string | number | undefined;
            let right: string | number | undefined = undefined;
            let bottom: number;
            let rotate: number;

            if (isMobile) {
                // Mobile: Align LEFT using fixed pixels
                left = MOBILE_SUB_FLY_CONFIG.TARGET_LEFT;
                bottom = MOBILE_SUB_FLY_CONFIG.TARGET_BOTTOM + (index * MOBILE_SUB_FLY_CONFIG.BOTTOM_STEP);
                rotate = MOBILE_SUB_FLY_CONFIG.BASE_ROT + (index * MOBILE_SUB_FLY_CONFIG.ROT_STEP);
            } else {
                // Desktop: Align RIGHT using percentages
                const rightPct = SUB_FLY_CONFIG.TARGET_RIGHT_PCT + (index * SUB_FLY_CONFIG.RIGHT_STEP);
                right = `${rightPct}%`;
                bottom = SUB_FLY_CONFIG.TARGET_BOTTOM + (index * SUB_FLY_CONFIG.BOTTOM_STEP);
                rotate = SUB_FLY_CONFIG.BASE_ROT + (index * SUB_FLY_CONFIG.ROT_STEP);
            }

            items.push({
                key: 'ps',
                name: 'PS Plus',
                Icon: PS5Icon,
                left, right, bottom, rotate
            });
        }
        return items;
    }, [release.onGamePass, release.onPSPlus, isMobile]);

    // --- INVISIBLE BRIDGE RENDERER ---
    const renderHoverBridge = () => {
        if (!isHovered || isMobile) return null; // FIX: Disabled on mobile
        return (
            <div 
                style={{
                    position: 'absolute',
                    // Targeted bridge for Dev/Publisher tags (Top)
                    bottom: '95%', // Starts just inside the top edge to catch exit
                    left: '10%', 
                    width: '80%', 
                    height: '140px', // Reach up to cover the tags area
                    backgroundColor: 'transparent',
                    pointerEvents: 'auto',
                    zIndex: 90
                }}
                onMouseEnter={() => setIsHovered(true)}
            />
        );
    };

    return (
        <motion.div
            ref={livingCardRef}
            className={`${styles.livingCardWrapper} ${isHovered ? styles.activeState : ''}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchMove={handleTouchMove}
            style={livingCardAnimation.style}
        >
            <div className={`${styles.timelineCard} ${autoHeight ? styles.autoHeight : ''}`} style={{ position: 'relative' }}>
                
                {/* --- INTERACTIVE LAYER (OVERLAY) --- */}
                {/* This layer sits on top of everything. The wrapper has pointer-events: none, but children have auto. */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                    
                    {/* Video Player */}
                    {isVideoActive && trailerId && (
                         <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', zIndex: 110, pointerEvents: 'auto' }}>
                             <iframe 
                                ref={videoRef}
                                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                                title="Trailer"
                                style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                            />
                            <button 
                                onClick={handleCloseVideo}
                                onTouchStart={(e) => e.stopPropagation()} // Stop bubbling for touch
                                style={{ 
                                    position: 'absolute', top: '1rem', right: '1rem', 
                                    background: 'rgba(0,0,0,0.6)', color: '#fff', 
                                    border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 120
                                }}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    )}
                    
                    {/* Controls (Wishlist, Pins) */}
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 30, display: 'flex', gap: '0.8rem', pointerEvents: 'auto' }}>
                        
                        {/* 1. Wishlist Button */}
                        <motion.button
                            className={styles.wishlistButton}
                            onClick={toggleWishlist}
                            onTouchStart={(e) => e.stopPropagation()} // Stop bubbling for touch
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{ 
                                width: '32px', height: '32px',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                // Uniform Styling Logic
                                border: '1px solid var(--accent)', 
                                backgroundColor: isBookmarked ? 'var(--accent)' : 'rgba(0, 0, 0, 0.6)',
                                color: isBookmarked ? '#000000' : 'var(--accent)',
                                backdropFilter: 'blur(4px)',
                                boxShadow: isBookmarked ? '0 0 10px var(--accent)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                            title={isBookmarked ? "إزالة من المحفوظات" : "حفظ"}
                        >
                            {isBookmarked ? <AddToListSolidIcon /> : <AddToListStrokeIcon />}
                        </motion.button>

                        {/* 2. Admin Pin Button */}
                         {showAdminControls && (
                            <div onTouchStart={(e) => e.stopPropagation()}>
                                <AdminPinButton releaseId={release._id} isPinned={release.isPinned || false} />
                            </div>
                        )}

                    </div>

                    {/* Play Button */}
                    {!isVideoActive && trailerId && (
                         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, pointerEvents: 'none' }}>
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.button 
                                        key="play-button"
                                        initial={{ opacity: 0, scale: PLAY_BUTTON_CONFIG.INITIAL_SCALE, x: PLAY_BUTTON_CONFIG.OFFSET_X, y: PLAY_BUTTON_CONFIG.OFFSET_Y + 20 }}
                                        animate={{ opacity: 1, scale: activeTagScale, x: PLAY_BUTTON_CONFIG.OFFSET_X, y: PLAY_BUTTON_CONFIG.OFFSET_Y, rotate: PLAY_BUTTON_CONFIG.ROTATE }}
                                        exit={{ opacity: 0, scale: PLAY_BUTTON_CONFIG.INITIAL_SCALE, x: PLAY_BUTTON_CONFIG.OFFSET_X, y: PLAY_BUTTON_CONFIG.OFFSET_Y + 20 }}
                                        transition={morphTransition}
                                        className={styles.playButtonContainer}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleWatchClick}
                                        onTouchStart={(e) => e.stopPropagation()} // Stop bubbling for touch
                                    >
                                        <span style={{ marginLeft: '0.4rem' }}>الإعلان</span>
                                        <YoutubeIcon />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* --- MAIN CARD LINK (BACKGROUND) --- */}
                <Link 
                    href={mainHref} 
                    className="no-underline block h-full"
                    onClick={handleClick}
                    prefetch={false}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <motion.div className={styles.glare} style={{ '--mouse-x': glareX, '--mouse-y': glareY } as any} />

                    <div className={styles.imageFrame}>
                        {isReleased ? (
                            <div className={`${styles.statusBadge} ${styles.released}`}>
                                <CheckIcon className={styles.iconSvg} />
                                <span>صدرت</span>
                            </div>
                        ) : (
                            <div className={`${styles.statusBadge} ${styles.upcoming}`}>
                                <ClockIcon className={styles.iconSvg} />
                                <span>قادمة</span>
                            </div>
                        )}

                        <motion.div layoutId={`${layoutIdPrefix}-image`} className="relative w-full h-full">
                             {/* Image Always Rendered underneath */}
                             <Image
                                loader={sanityLoader}
                                src={imageUrl}
                                alt={release.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className={styles.cardImage}
                                placeholder={blurDataURL ? 'blur' : 'empty'}
                                blurDataURL={blurDataURL}
                                style={{ opacity: isVideoActive ? 0 : 1 }} // Hide image if video playing
                            />
                        </motion.div>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.titleRow}>
                            <motion.h3 
                                layoutId={`${layoutIdPrefix}-title`} 
                                className={styles.cardTitle}
                                style={{ direction: 'ltr', textAlign: 'left', width: '100%' }}
                            >
                                {release.title}
                            </motion.h3>
                        </div>
                        
                        <div className={styles.metaGrid}>
                            <div className={styles.dateBlock}>
                                <Calendar03Icon className={styles.iconSvg} style={{ color: 'var(--accent)' }} />
                                <span>{formattedDate}</span>
                            </div>
                            
                            <div className={styles.platformRow}>
                                {platformConfig.map(p => {
                                    if (!p) return null;
                                    const lid = `plat-${release._id}-${p.key}`;
                                    // FIX: Only hide static icons if hovered AND NOT mobile
                                    if (isHovered && !isMobile) return null;

                                    return (
                                        <div key={p.key} style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <motion.div
                                                layoutId={lid}
                                                className={styles.platformTagBase}
                                                initial={false}
                                                animate={{ 
                                                    rotate: 0, scale: 1, 
                                                    backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)", 
                                                    color: "var(--text-secondary)"
                                                }}
                                                style={{ padding: 0 }}
                                            >
                                                <p.Icon className={styles.platformIcon} style={{ width: '16px', height: '16px' }} />
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* --- HOVER BRIDGES --- */}
                {renderHoverBridge()}

                {/* --- FLYING PLATFORM TAGS --- */}
                <div className={styles.flyingTagsContainer} style={{ right: 'auto', left: 0, width: '100%' }}>
                    {isHovered && !isMobile && platformConfig.map(p => { // FIX: Don't render if mobile
                        const lid = `plat-${release._id}-${p.key}`;
                        return (
                            <motion.div
                                key={p.key}
                                layoutId={lid}
                                className={`${styles.platformTagBase} ${styles.flying}`}
                                transition={{ 
                                    ...morphTransition, 
                                    rotate: { duration: 0 } // Snap rotation immediately
                                }}
                                initial={false}
                                animate={{ 
                                    rotate: p.rotate, 
                                    scale: 1.2 * activeTagScale, 
                                    backgroundColor: "rgba(0, 0, 0, 0.85)", 
                                    borderColor: "var(--accent)", 
                                    color: "var(--accent)",
                                    x: 15,
                                    z: 60  
                                }}
                                whileHover={{ zIndex: 500, scale: 1.3 * activeTagScale }}
                                style={{ 
                                    position: 'absolute', 
                                    left: p.left, 
                                    bottom: p.bottom, 
                                    padding: "0.4rem 1rem", 
                                    zIndex: 100, 
                                    boxShadow: "0 0 15px color-mix(in srgb, var(--accent) 30%, transparent)", 
                                    transformOrigin: 'center',
                                    flexDirection: 'row-reverse' 
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p.Icon className={styles.platformIcon} style={{ width: '16px', height: '16px' }} />
                                <span style={{ overflow: 'hidden', fontSize: '1.1rem' }}>{p.name}</span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* --- FLYING DEV/PUB TAGS --- */}
                <div className={styles.flyingTagsContainer} style={{ right: 0, left: 'auto', width: '100%' }}>
                     {isHovered && devPubConfig.map((item, i) => (
                         <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: 0, rotate: 0 }}
                            animate={{ 
                                opacity: 1, 
                                rotate: item.rotate, 
                                scale: 1.15 * activeTagScale,
                                x: isMobile ? 0 : -20, 
                                z: 60 
                            }}
                            whileHover={{ zIndex: 500, scale: 1.2 * activeTagScale }}
                            exit={{ opacity: 0, x: 0 }}
                            transition={{ ...morphTransition, delay: i * 0.03 }}
                            style={{
                                position: 'absolute',
                                left: item.left, 
                                bottom: item.bottom,
                                transformOrigin: 'center',
                                cursor: 'pointer',
                                zIndex: 100
                            }}
                         >
                            <Link 
                                href={item.link}
                                onClick={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()} // Stop bubbling for touch
                                className={`${styles.shardPill} ${styles.devPill} ${styles.interactive} no-underline`}
                                prefetch={false}
                                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                            >
                                <span>{item.label}</span>
                            </Link>
                         </motion.div>
                     ))}
                </div>

                {/* --- FLYING SUBSCRIPTION TAGS --- */}
                <div className={styles.flyingTagsContainer} style={{ left: 0, right: 'auto', width: '100%' }}>
                    {isHovered && subConfig.map((sub, i) => (
                        <motion.div
                            key={sub.key}
                            initial={{ opacity: 0, x: 0, rotate: 0 }}
                            animate={{ 
                                opacity: 1, rotate: sub.rotate, scale: 1.2 * activeTagScale,
                                x: isMobile ? 0 : -15, z: 60 
                            }}
                            whileHover={{ zIndex: 500, scale: 1.3 * activeTagScale }}
                            exit={{ opacity: 0, x: 0 }}
                            transition={{ ...morphTransition, delay: i * 0.03 }}
                            style={{ 
                                position: 'absolute', 
                                right: sub.right,
                                left: sub.left,
                                bottom: sub.bottom, 
                                transformOrigin: 'center', cursor: 'default' 
                            }}
                        >
                            <div className={`${styles.genrePill} no-underline`} style={{ 
                                direction: isMobile ? 'ltr' : undefined,
                                flexDirection: 'row' // Force row layout
                            }}>
                                <sub.Icon style={{ width: '16px', height: '16px' }} />
                                <span style={{ fontSize: '1.1rem' }}>{sub.name}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- FLYING SATELLITES --- */}
                <div className={styles.satelliteField}>
                    <AnimatePresence>
                        {isHovered && flyingItems.map((item, i) => {
                            if (!item) return null;
                            const pillStyleClass = `${styles.shardPill} ${styles.statusPill} ${styles[item.colorClass]}`;

                            return (
                                <motion.div
                                    key={`shard-${i}`}
                                    className={styles.satelliteShard}
                                    initial={{ opacity: 0, scale: 0.4, y: 0, z: 0 }}
                                    animate={{ 
                                        opacity: 1, scale: 1.1 * activeTagScale, x: item.x, y: item.y, rotate: item.rotate, z: 60 
                                    }}
                                    whileHover={{ zIndex: 500, scale: 1.2 * activeTagScale }}
                                    exit={{ opacity: 0, scale: 0.4, y: 0 }}
                                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                                    style={{ 
                                        position: 'absolute', left: '50%', right: 'auto', transformOrigin: 'center', cursor: 'default', zIndex: 100
                                    }}
                                >
                                    <div className={pillStyleClass}>{item.label}</div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
};

export default memo(TimelineCardComponent);