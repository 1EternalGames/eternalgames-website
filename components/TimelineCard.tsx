// components/TimelineCard.tsx
'use client';

import React, { memo, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
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
import { useIsMobile } from '@/hooks/useIsMobile';
import { useActiveCardStore } from '@/lib/activeCardStore';
import { usePerformanceStore } from '@/lib/performanceStore';

import { Calendar03Icon } from '@/components/icons';
import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

import styles from './TimelineCard.module.css';

// ... (Previous Constants kept identical)
const DESKTOP_TAG_SCALE = 0.8; 
const MOBILE_TAG_SCALE = 0.8; 
const YoutubeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const AddToListStrokeIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 9V20C3.5 21.1046 4.39543 22 5.5 22H18.5C19.6046 22 20.5 21.1046 20.5 20V4C20.5 2.89543 19.6046 2 18.5 2H12"></path><path d="M13.5 17H17.5"></path><path d="M13.5 7H17.5"></path><path d="M13.5 12H17.5"></path><path d="M6.5 16.5L8 18L11 14"></path><path d="M10 5H3.5M10 5L7.08333 2M10 5L7.08333 8"></path></svg>);
const AddToListSolidIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M8.05033 1.55292C7.66534 1.15694 7.03224 1.14802 6.63626 1.53301C6.24027 1.91799 6.23135 2.55109 6.61634 2.94708L7.88307 4.25H3.75C3.19772 4.25 2.75 4.69772 2.75 5.25C2.75 5.80229 3.19772 6.25 3.75 6.25H7.88307L6.61634 7.55292C6.23135 7.94891 6.24027 8.58201 6.63625 8.967C7.03224 9.35198 7.66534 9.34306 8.05033 8.94708L10.967 5.94708C11.3443 5.55896 11.3443 4.94104 10.967 4.55292L8.05033 1.55292ZM2.75 20V7.5H5.21144C4.92844 8.30226 5.11492 9.23131 5.76491 9.86324C6.65587 10.7295 8.08035 10.7094 8.94657 9.81843L11.8632 6.81843C12.7123 5.94516 12.7123 4.55485 11.8632 3.68158L9.49921 1.25H18.5C20.0188 1.25 21.25 2.48122 21.25 4V20C21.25 21.5188 20.0188 22.75 18.5 22.75H5.5C3.98122 22.75 2.75 21.5188 2.75 20ZM13.5 16.25C13.0858 16.25 12.75 16.5858 12.75 17C12.75 17.4142 13.0858 17.75 13.5 17.75H17.5C17.9142 17.75 18.25 17.4142 18.25 17C18.25 16.5858 17.9142 16.25 17.5 16.25H13.5ZM12.75 7C12.75 6.58579 13.0858 6.25 13.5 6.25H17.5C17.9142 6.25 18.25 6.58579 18.25 7C18.25 7.41421 17.9142 7.75 17.5 7.75H13.5C13.0858 7.75 12.75 7.41421 12.75 7ZM13.5 11.25C13.0858 11.25 12.75 11.5858 12.75 12C12.75 12.4142 13.0858 12.75 13.5 12.75H17.5C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25H13.5ZM11.45 13.4C11.7814 13.6486 11.8485 14.1187 11.6 14.45L8.6 18.45C8.46955 18.624 8.27004 18.7327 8.05317 18.7482C7.8363 18.7636 7.62341 18.6841 7.46967 18.5304L5.96967 17.0304C5.67678 16.7375 5.67678 16.2626 5.96967 15.9697C6.26256 15.6768 6.73744 15.6768 7.03033 15.9697L7.91885 16.8582L10.4 13.55C10.6485 13.2187 11.1186 13.1515 11.45 13.4Z" fill="currentColor"></path></svg>);
const ArrowDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const WatchIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const CheckmarkCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M11.75 22.5C5.81294 22.5 1 17.6871 1 11.75C1 5.81294 5.81294 1 11.75 1C17.6871 1 22.5 5.81294 22.5 11.75C22.5 17.6871 17.6871 22.5 11.75 22.5ZM16.1901 9.64829C16.6861 9.40536 16.8912 8.80634 16.6483 8.31036C16.4053 7.81437 15.8063 7.60923 15.3103 7.85216C13.3545 8.81011 11.8402 10.4539 10.8372 11.7938C10.4896 12.2581 10.1962 12.6957 9.96026 13.071C9.68112 12.8292 9.40583 12.6289 9.16316 12.4689C8.88562 12.2859 8.63935 12.1481 8.45963 12.0548C8.36951 12.008 8.29538 11.9719 8.24153 11.9466C8.21458 11.934 8.19265 11.924 8.17625 11.9166L8.15586 11.9076L8.14888 11.9046L8.14622 11.9034L8.14412 11.9025C8.14388 11.9024 8.14412 11.9025 7.7502 12.8217L8.14412 11.9025C7.63649 11.685 7.04861 11.9201 6.83106 12.4277C6.61392 12.9344 6.84809 13.5211 7.3537 13.7397L7.35473 13.7401L7.35829 13.7417C7.3643 13.7444 7.37547 13.7495 7.3913 13.7569C7.423 13.7718 7.47309 13.7961 7.53765 13.8296C7.66731 13.897 7.85228 14.0002 8.06224 14.1387C8.49104 14.4214 8.97956 14.8217 9.33097 15.3237C9.53389 15.6136 9.8749 15.7746 10.2277 15.7472C10.5803 15.7198 10.8924 15.5078 11.0482 15.1902L11.0508 15.1851L11.0653 15.1563C11.079 15.1295 11.1005 15.0879 11.1297 15.0332C11.1882 14.9235 11.2772 14.7614 11.3954 14.56C11.6323 14.1564 11.9838 13.5994 12.4382 12.9924C13.3602 11.7609 14.6459 10.4046 16.1901 9.64829Z" fill="currentColor"></path>
    </svg>
);

// --- CONFIGS ---
const PLATFORM_FLY_CONFIG = { LEFT_ANCHOR: '80%', TARGET_TOP: 170, TOP_STEP: 33, BASE_ROT: -5, ROT_STEP: 0, SCALE: 0.75 };
const PRICE_FLY_CONFIG = { X: 40, Y: -60, ROT: 5, SCALE: 0.75 }; 
const VIDEO_PRICE_FLY_CONFIG = { X: 40, Y: -115, ROT: 5, SCALE: 0.75 };
const STATUS_FLY_CONFIG = { X: 0, Y: 140, ROT: -3, SCALE: 0.75 };
const PLAY_BUTTON_CONFIG = { OFFSET_X: 0, OFFSET_Y: 70, ROTATE: 0, INITIAL_SCALE: 1 };
const CLICK_MORE_CONFIG = { X: -65, Y: -170, ROT: 0, SCALE: 0.7 };
const DEV_FLY_CONFIG = { X: -90, Y: -155, ROT: 0, SCALE: 0.65 };
const PUB_FLY_CONFIG = { X: 100, Y: -155, ROT: 0, SCALE: 0.65 };
const DESKTOP_GP_CONFIG = { LEFT: '-8%', TOP: 257, ROT: 5, SCALE: 0.7 };
const VIDEO_DESKTOP_GP_CONFIG = { LEFT: '-8%', TOP: 210, ROT: 5, SCALE: 0.7 };
const DESKTOP_PS_CONFIG = { LEFT: '-8%', TOP: 225, ROT: 5, SCALE: 0.7 };
const VIDEO_DESKTOP_PS_CONFIG = { LEFT: '-8%', TOP: 175, ROT: 5, SCALE: 0.7 };

const MOBILE_STANDARD_PLATFORM_FLY_CONFIG = { LEFT_ANCHOR: '75%', TARGET_TOP: 220, TOP_STEP: 35, BASE_ROT: 0, ROT_STEP: 0, SCALE: 0.8 };
const MOBILE_STANDARD_PRICE_FLY_CONFIG = { X: 55, Y: -45, ROT: -2, SCALE: 0.8 };
const MOBILE_STANDARD_STATUS_FLY_CONFIG = { X: 0, Y: 100, ROT: 0, SCALE: 0.8 };
const MOBILE_STANDARD_CLICK_MORE_CONFIG = { X: -50, Y: -160, ROT: 0, SCALE: 0.8 };
const MOBILE_STANDARD_GP_CONFIG = { LEFT: 15, TOP: 230, ROT: -2, SCALE: 0.8 }; 
const MOBILE_STANDARD_PS_CONFIG = { RIGHT: 15, TOP: 230, ROT: 2, SCALE: 0.8 }; 
const MOBILE_STANDARD_PLAY_BUTTON_CONFIG = { OFFSET_X: 0, OFFSET_Y: 75, ROTATE: 0, INITIAL_SCALE: 1 };

const MOBILE_HOMEPAGE_PLATFORM_FLY_CONFIG = { LEFT_ANCHOR: '75%', TARGET_TOP: 180, TOP_STEP: 30, BASE_ROT: 0, ROT_STEP: 0, SCALE: 0.7 };
const MOBILE_HOMEPAGE_PRICE_FLY_CONFIG = { X: 50, Y: -45, ROT: -2, SCALE: 0.6 };
const MOBILE_HOMEPAGE_STATUS_FLY_CONFIG = { X: 0, Y: 80, ROT: 0, SCALE: 0.7 };
const MOBILE_HOMEPAGE_CLICK_MORE_CONFIG = { X: -40, Y: -110, ROT: 0, SCALE: 0.6 };
const MOBILE_HOMEPAGE_GP_CONFIG = { LEFT: 0, TOP: 165, ROT: -2, SCALE: 0.5 };
const MOBILE_HOMEPAGE_PS_CONFIG = { RIGHT: 0, TOP: 165, ROT: 2, SCALE: 0.5 };
const MOBILE_HOMEPAGE_PLAY_BUTTON_CONFIG = { OFFSET_X: 0, OFFSET_Y: 0, ROTATE: 0, INITIAL_SCALE: 0.8 };

export const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = { 'PC': PCIcon, 'PlayStation': PS5Icon, 'Xbox': XboxIcon, 'Switch': SwitchIcon };
export const PlatformNames: Record<string, string> = { 'PC': 'PC', 'PlayStation': 'PS5', 'Xbox': 'Xbox', 'Switch': 'Switch' };
const PLATFORM_SORT_WEIGHTS: Record<string, number> = { 'Switch': 4, 'Xbox': 3, 'PlayStation': 2, 'PC': 1 };

const morphTransition: Transition = { type: "spring", stiffness: 220, damping: 25, mass: 1.0 };

type ExtendedRelease = SanityGameRelease & { 
    game?: { slug?: string, title?: string }, 
    tags?: any[], 
    onGamePass?: boolean, 
    onPSPlus?: boolean,
    developer?: { title: string, slug?: string },
    publisher?: { title: string, slug?: string },
    datePrecision?: 'day' | 'month' | 'year',
};

const TimelineCardComponent = ({ 
    release, 
    autoHeight = false,
    showAdminControls = false,
    variant = 'default'
}: { 
    release: ExtendedRelease,
    autoHeight?: boolean,
    showAdminControls?: boolean,
    variant?: 'default' | 'homepage'
}) => {
    const isMobile = useIsMobile();
    // Performance Settings
    const { isLivingCardEnabled, isFlyingTagsEnabled, isHeroTransitionEnabled, isCornerAnimationEnabled } = usePerformanceStore();

    const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
    const setPrefix = useLayoutIdStore((state) => state.setPrefix);
    const { data: session } = useSession();
    const { toggleBookmark, bookmarks, setSignInModalOpen } = useUserStore();
    const { activeCardId, setActiveCardId } = useActiveCardStore();
    
    const [isHoveredLocal, setIsHoveredLocal] = useState(false);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    
    // OPTIMIZATION: Debounce Timer Ref
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
    
    const videoRef = useRef<HTMLIFrameElement>(null);
    const isHovered = isMobile ? activeCardId === release._id : isHoveredLocal;

    const mobileConfig = useMemo(() => {
        if (variant === 'homepage') {
            return {
                platform: MOBILE_HOMEPAGE_PLATFORM_FLY_CONFIG,
                price: MOBILE_HOMEPAGE_PRICE_FLY_CONFIG,
                status: MOBILE_HOMEPAGE_STATUS_FLY_CONFIG,
                clickMore: MOBILE_HOMEPAGE_CLICK_MORE_CONFIG,
                gp: MOBILE_HOMEPAGE_GP_CONFIG,
                ps: MOBILE_HOMEPAGE_PS_CONFIG,
                play: MOBILE_HOMEPAGE_PLAY_BUTTON_CONFIG 
            };
        }
        return {
            platform: MOBILE_STANDARD_PLATFORM_FLY_CONFIG,
            price: MOBILE_STANDARD_PRICE_FLY_CONFIG,
            status: MOBILE_STANDARD_STATUS_FLY_CONFIG,
            clickMore: MOBILE_STANDARD_CLICK_MORE_CONFIG,
            gp: MOBILE_STANDARD_GP_CONFIG,
            ps: MOBILE_STANDARD_PS_CONFIG,
            play: MOBILE_STANDARD_PLAY_BUTTON_CONFIG 
        };
    }, [variant]);
    
    const playConfig = isMobile ? mobileConfig.play : PLAY_BUTTON_CONFIG;

    useClickOutside(livingCardRef, () => {
        if (isMobile && activeCardId === release._id) {
            setActiveCardId(null);
        }
    });

    const activeTagScale = isMobile ? MOBILE_TAG_SCALE : DESKTOP_TAG_SCALE;
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 150 });
    const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 150 });
    const glareX = useTransform(smoothMouseX, [0, 1], ['0%', '100%']);
    const glareY = useTransform(smoothMouseY, [0, 1], ['0%', '100%']);

    const effectivelyDisabledLiving = !isLivingCardEnabled;

    const handlers = !isMobile ? {
        onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
            if (!effectivelyDisabledLiving) {
                livingCardAnimation.onMouseMove(e);
                if (livingCardRef.current) {
                    const { left, top, width, height } = livingCardRef.current.getBoundingClientRect();
                    mouseX.set((e.clientX - left) / width);
                    mouseY.set((e.clientY - top) / height);
                }
            }
        },
        onMouseEnter: () => {
             if (!effectivelyDisabledLiving) {
                 livingCardAnimation.onMouseEnter();
             }
             // OPTIMIZATION: Debounce the hover state
             if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
             hoverTimeout.current = setTimeout(() => {
                 setIsHoveredLocal(true);
             }, 75); // 75ms delay
        },
        onMouseLeave: () => {
             if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
             if (!effectivelyDisabledLiving) {
                 livingCardAnimation.onMouseLeave();
             }
             setIsHoveredLocal(false);
             mouseX.set(0.5); mouseY.set(0.5);
        }
    } : {
        onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            if (activeCardId !== release._id) {
                setActiveCardId(release._id);
            }
            if (!effectivelyDisabledLiving) {
                livingCardAnimation.onTouchStart(e);
            }
        },
        onTouchMove: !effectivelyDisabledLiving ? livingCardAnimation.onTouchMove : undefined,
        onTouchEnd: !effectivelyDisabledLiving ? livingCardAnimation.onTouchEnd : undefined,
    };

    const toggleWishlist = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!session) { setSignInModalOpen(true); return; }
        toggleBookmark(release.legacyId, 'release'); 
    };

    const isBookmarked = bookmarks.includes(`release-${release.legacyId}`);
    const trailerId = useMemo(() => {
        if (!release.trailer) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = release.trailer.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }, [release.trailer]);

    const handleWatchClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (variant === 'homepage') {
            setShowVideoModal(true);
        } else {
            setIsVideoActive(true);
        }
    };

    const handleCloseVideo = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsVideoActive(false);
        setShowVideoModal(false); 
    };

    const releaseDate = new Date(release.releaseDate);
    const isReleased = releaseDate < new Date();
    const isTBA = release.isTBA;
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    let formattedDate = '';
    if (isTBA) {
        formattedDate = "غير معلن";
    } else {
        const d = releaseDate.getDate();
        const m = arabicMonths[releaseDate.getMonth()];
        const y = releaseDate.getFullYear();
        
        if (release.datePrecision === 'year') {
            formattedDate = `${y}`;
        } else if (release.datePrecision === 'month') {
            formattedDate = `${m} ${y}`;
        } else {
            formattedDate = `${d} ${m} ${y}`;
        }
    }

    const gameLink = release.game?.slug ? `/games/${release.game.slug}` : null;
    const mainHref = gameLink || '/releases'; 
    const layoutIdPrefix = `timeline-${release._id}`;
    
    const platforms = useMemo(() => {
        const raw = release.platforms || [];
        const normalizedSet = new Set<string>();
        raw.forEach(p => { if (p === 'PlayStation 5') normalizedSet.add('PlayStation'); else normalizedSet.add(p); });
        return Array.from(normalizedSet);
    }, [release.platforms]);

    const safeLayoutIdPrefix = isHeroTransitionEnabled ? layoutIdPrefix : undefined;

    const handleClick = (e: React.MouseEvent) => {
        if (isMobile && activeCardId !== release._id) {
            e.preventDefault();
            return;
        }
        if (!gameLink || isVideoActive) return; 
        if (!isMobile && isHeroTransitionEnabled) {
             setPrefix(layoutIdPrefix);
        }
    };

    const imageUrl = release.mainImage 
        ? urlFor(release.mainImage).width(800).height(450).fit('crop').auto('format').url()
        : '/placeholder-game.jpg';
    
    const blurDataURL = release.mainImage?.blurDataURL;

    // --- Flying Items ---
    const flyingItems = useMemo(() => {
        const satellites = [];
        const STATUS_CFG = isMobile ? mobileConfig.status : STATUS_FLY_CONFIG;
        const CLICK_CFG = isMobile ? mobileConfig.clickMore : CLICK_MORE_CONFIG;

        let PRICE_CFG = isMobile ? mobileConfig.price : PRICE_FLY_CONFIG;
        if (!isMobile && isVideoActive) {
            PRICE_CFG = VIDEO_PRICE_FLY_CONFIG;
        }

        satellites.push({ 
            type: 'clickHint', 
            label: 'اضغط للمزيد', 
            icon: <ArrowDownIcon />,
            colorClass: 'cyan',
            x: CLICK_CFG.X, y: CLICK_CFG.Y, rotate: CLICK_CFG.SCALE, 
            scale: CLICK_CFG.SCALE, 
            anchor: 'center', link: mainHref 
        });

        if (!isReleased && !isTBA) {
             const msPerDay = 1000 * 60 * 60 * 24;
             const daysLeft = Math.ceil((releaseDate.getTime() - new Date().getTime()) / msPerDay);
             let label = `باقي ${daysLeft} يوم`;
             let colorClass = "cyan";
             if (daysLeft <= 3) colorClass = "golden";
             else if (daysLeft <= 10) colorClass = "red";
             else if (daysLeft <= 20) colorClass = "orange";
             satellites.push({ type: 'status', label: label, colorClass: colorClass, x: STATUS_CFG.X, y: STATUS_CFG.Y, rotate: STATUS_CFG.ROT, scale: STATUS_CFG.SCALE, anchor: 'center', link: null });
        }

        if (release.price) {
            satellites.push({ type: 'price', label: release.price, x: PRICE_CFG.X, y: PRICE_CFG.Y, rotate: PRICE_CFG.ROT, scale: PRICE_CFG.SCALE, anchor: 'left', link: null, colorClass: 'pricePill' });
        }
        
        if (!isMobile) {
            if (release.publisher?.title) {
                const pubSlug = release.publisher.slug;
                const pubLink = pubSlug ? `/publishers/${pubSlug}` : null;
                satellites.push({ type: 'publisher', label: release.publisher.title, x: PUB_FLY_CONFIG.X, y: PUB_FLY_CONFIG.Y, rotate: PUB_FLY_CONFIG.ROT, scale: PUB_FLY_CONFIG.SCALE, anchor: 'left', link: pubLink, colorClass: 'devPill' });
            }
            if (release.developer?.title && release.developer.title !== release.publisher?.title) {
                const devSlug = release.developer.slug;
                const devLink = devSlug ? `/developers/${devSlug}` : null;
                satellites.push({ type: 'developer', label: release.developer.title, x: DEV_FLY_CONFIG.X, y: DEV_FLY_CONFIG.Y, rotate: DEV_FLY_CONFIG.ROT, scale: DEV_FLY_CONFIG.SCALE, anchor: 'right', link: devLink, colorClass: 'devPill' });
            }
        }
        
        return satellites;
    }, [isReleased, isTBA, releaseDate, release.price, isMobile, mobileConfig, release.publisher, release.developer, mainHref, isVideoActive]);

    const platformConfig = useMemo(() => {
        const validPlatforms = platforms.filter(p => PlatformIcons[p]);
        validPlatforms.sort((a, b) => (PLATFORM_SORT_WEIGHTS[b] || 0) - (PLATFORM_SORT_WEIGHTS[a] || 0));
        const CFG = isMobile ? mobileConfig.platform : PLATFORM_FLY_CONFIG;
        return validPlatforms.map((p, i) => {
            const Icon = PlatformIcons[p];
            const top = CFG.TARGET_TOP + (i * CFG.TOP_STEP); 
            return { key: p, name: PlatformNames[p] || p, Icon: Icon, left: CFG.LEFT_ANCHOR, top, rotate: CFG.BASE_ROT, scale: CFG.SCALE };
        });
    }, [platforms, isMobile, mobileConfig]);

    const subConfig = useMemo(() => {
        const items = [];
        if (release.onPSPlus) {
            let left, top, rotate, scale;
            if (isMobile) { 
                left = 'auto'; 
                const cfg = mobileConfig.ps;
                left = 'auto'; top = cfg.TOP; rotate = cfg.ROT; scale = cfg.SCALE;
            } else {
                const cfg = isVideoActive ? VIDEO_DESKTOP_PS_CONFIG : DESKTOP_PS_CONFIG;
                left = cfg.LEFT; top = cfg.TOP; rotate = cfg.ROT; scale = cfg.SCALE;
            }
            items.push({ key: 'ps', name: 'PS Plus', Icon: PS5Icon, left: isMobile ? 'auto' : left, right: isMobile ? mobileConfig.ps.RIGHT : 'auto', top, rotate, scale });
        }

        if (release.onGamePass) {
            let left, top, rotate, scale;
            if (isMobile) { 
                left = mobileConfig.gp.LEFT; top = mobileConfig.gp.TOP; rotate = mobileConfig.gp.ROT; scale = mobileConfig.gp.SCALE;
            } else {
                 const cfg = isVideoActive ? VIDEO_DESKTOP_GP_CONFIG : DESKTOP_GP_CONFIG;
                 left = cfg.LEFT; top = cfg.TOP; rotate = cfg.ROT; scale = cfg.SCALE;
            }
            items.push({ key: 'gp', name: 'Game Pass', Icon: XboxIcon, left, right: 'auto', top, rotate, scale });
        }

        return items;
    }, [release.onGamePass, release.onPSPlus, isMobile, mobileConfig, isVideoActive]);

    const renderHoverBridge = () => {
        if (!isHovered || isMobile) return null; 
        return (
            <div 
                style={{
                    position: 'absolute',
                    bottom: '95%',
                    left: '10%', 
                    width: '80%', 
                    height: '80px',
                    backgroundColor: 'transparent',
                    pointerEvents: 'auto',
                    zIndex: 90
                }}
                onMouseEnter={() => {
                    // Reset timeout to keep it open
                    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                    setIsHoveredLocal(true);
                }}
            />
        );
    };
    
    const animationStyles = !effectivelyDisabledLiving ? livingCardAnimation.style : {};

    return (
        <>
            <AnimatePresence>
                {showVideoModal && trailerId && (
                    createPortal(
                        <motion.div 
                            className={styles.videoOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseVideo}
                        >
                             <motion.div 
                                className={styles.videoModal}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className={styles.modalCloseButton} onClick={handleCloseVideo}>
                                    <span>إغلاق</span>
                                    <CloseIcon />
                                </button>
                                <iframe 
                                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&controls=1&modestbranding=1&rel=0`} 
                                    title="Trailer Modal" 
                                    style={{ width: '100%', height: '100%', border: 'none' }} 
                                    allow="autoplay; encrypted-media; fullscreen" 
                                    allowFullScreen 
                                />
                            </motion.div>
                        </motion.div>,
                        document.body
                    )
                )}
            </AnimatePresence>

            <motion.div
                ref={livingCardRef}
                className={`${styles.livingCardWrapper} ${isHovered ? styles.activeState : ''} ${!isCornerAnimationEnabled ? 'noCornerAnimation' : ''}`}
                {...handlers}
                style={animationStyles}
            >
                <div className={`${styles.timelineCard} ${autoHeight ? styles.autoHeight : ''} ${variant === 'homepage' ? styles.homepage : ''}`} style={{ position: 'relative' }}>
                    
                    <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
                         {isVideoActive && trailerId && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', zIndex: 110, pointerEvents: 'auto' }}>
                                <iframe ref={videoRef} src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&controls=1&modestbranding=1&rel=0`} title="Trailer" style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
                                <button onClick={handleCloseVideo} onTouchStart={(e) => e.stopPropagation()} className={styles.videoCloseButton}> <CloseIcon /> </button>
                            </div>
                        )}
                        
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 30, display: 'flex', gap: '0.8rem', pointerEvents: 'auto' }}>
                            <motion.button className={styles.wishlistButton} onClick={toggleWishlist} onTouchStart={(e) => e.stopPropagation()} initial={{ scale: 0.9 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ border: '1px solid var(--accent)', backgroundColor: isBookmarked ? 'var(--accent)' : 'rgba(0, 0, 0, 0.6)', color: isBookmarked ? '#000000' : 'var(--accent)', backdropFilter: 'blur(4px)', boxShadow: isBookmarked ? '0 0 10px var(--accent)' : 'none', transition: 'all 0.2s ease' }} title={isBookmarked ? "إزالة من المحفوظات" : "حفظ"}> {isBookmarked ? <AddToListSolidIcon /> : <AddToListStrokeIcon />} </motion.button>
                            {showAdminControls && ( <div onTouchStart={(e) => e.stopPropagation()}> <AdminPinButton releaseId={release._id} isPinned={release.isPinned || false} /> </div> )}
                        </div>

                        {!isVideoActive && trailerId && !(isMobile && variant === 'homepage') && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, pointerEvents: 'none' }}>
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.button 
                                            key="play-button" 
                                            initial={{ opacity: 0, scale: playConfig.INITIAL_SCALE, x: playConfig.OFFSET_X, y: playConfig.OFFSET_Y + 20 }} 
                                            animate={{ opacity: 1, scale: activeTagScale, x: playConfig.OFFSET_X, y: playConfig.OFFSET_Y, rotate: playConfig.ROTATE }} 
                                            exit={{ opacity: 0, scale: playConfig.INITIAL_SCALE, x: playConfig.OFFSET_X, y: playConfig.OFFSET_Y + 20 }} 
                                            transition={morphTransition} 
                                            className={styles.playButtonContainer} 
                                            whileTap={{ scale: 0.95 }} 
                                            onClick={handleWatchClick} 
                                            onTouchStart={(e) => e.stopPropagation()}
                                        > 
                                            <span style={{ marginLeft: '0.4rem' }}>الإعلان</span> 
                                            <YoutubeIcon /> 
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    <Link href={mainHref} className="no-underline block h-full" onClick={handleClick} prefetch={false} style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div className={styles.glare} style={{ '--mouse-x': glareX, '--mouse-y': glareY } as any} />
                        
                        <div className={styles.monolithFrame}>
                             <div className={styles.cyberCorner} />

                            <div className={styles.imageFrame}>
                                {isReleased ? ( <div className={`${styles.statusBadge} ${styles.released}`} title="صدرت"> <CheckmarkCircleIcon /> </div> ) : ( <div className={`${styles.statusBadge} ${styles.upcoming}`} title="قادمة"> <WatchIcon /> </div> )}

                                <motion.div layoutId={!isMobile && safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-image` : undefined} className="relative w-full h-full">
                                    <Image loader={sanityLoader} src={imageUrl} alt={release.title} fill sizes="(max-width: 768px) 100vw, 400px" className={styles.cardImage} placeholder={blurDataURL ? 'blur' : 'empty'} blurDataURL={blurDataURL} style={{ opacity: isVideoActive ? 0 : 1 }} />
                                </motion.div>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.titleRow}>
                                <motion.h3 layoutId={!isMobile && safeLayoutIdPrefix ? `${safeLayoutIdPrefix}-title` : undefined} className={styles.cardTitle} style={{ direction: 'ltr', textAlign: 'left', width: '100%' }}> {release.title} </motion.h3>
                            </div>
                            <div className={styles.metaGrid}>
                                <div className={styles.dateBlock}> 
    {!isTBA && (
        <div className={styles.dateIconWrapper}><Calendar03Icon width="100%" height="100%" /></div> 
    )}
    <span>{formattedDate}</span> 
</div>
                                <div className={styles.platformRow}>
                                    {platformConfig.map(p => {
                                        if (!p || (isHovered && isFlyingTagsEnabled && !isMobile)) return null; 
                                        const lid = `plat-${release._id}-${p.key}`;
                                        return ( 
                                            <div key={p.key} style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}> 
                                                <motion.div 
                                                    layoutId={!isMobile && safeLayoutIdPrefix ? lid : undefined} 
                                                    className={styles.platformTagBase} 
                                                    style={{ padding: 0 }}
                                                > 
                                                    <p.Icon className={styles.platformIcon} /> 
                                                </motion.div> 
                                            </div> 
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Link>

                    {renderHoverBridge()}

                    {/* --- FLYING ITEMS --- */}
                    {isFlyingTagsEnabled && !isMobile && (
                         <div className={styles.flyingTagsContainer} style={{ right: 'auto', left: 0, width: '100%' }}>
                            <AnimatePresence>
                                {isHovered && platformConfig.map(p => {
                                    const lid = `plat-${release._id}-${p.key}`;
                                    return ( 
                                        <motion.div 
                                            key={p.key} 
                                            layoutId={!isMobile && safeLayoutIdPrefix ? lid : undefined} 
                                            className={`${styles.platformTagBase} ${styles.flying}`} 
                                            transition={morphTransition} 
                                            initial={false} 
                                            animate={{ rotate: p.rotate, scale: 1.2 * p.scale, backgroundColor: "rgba(0, 0, 0, 0.85)", borderColor: "var(--accent)", color: "var(--accent)", x: 15, z: 60 }} 
                                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                            whileHover={{ zIndex: 500, scale: 1.3 * p.scale }} 
                                            style={{ position: 'absolute', left: p.left, top: p.top, padding: "0.4rem 1rem", zIndex: 100, boxShadow: "0 0 15px color-mix(in srgb, var(--accent) 30%, transparent)", transformOrigin: 'center', flexDirection: 'row-reverse', overflow: 'hidden' }} 
                                            onClick={(e) => e.stopPropagation()}
                                        > 
                                            <p.Icon className={styles.platformIcon} style={{ width: '16px', height: '16px' }} /> 
                                            <span style={{ overflow: 'hidden', fontSize: '1.1rem' }}>{p.name}</span> 
                                        </motion.div> 
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                    
                    {/* Subscriptions */}
                    {isFlyingTagsEnabled && (
                        <div className={styles.flyingTagsContainer} style={{ left: 0, right: 0, width: '100%' }}>
                            <AnimatePresence>
                                {isHovered && subConfig.map((sub, i) => {
                                     const isLeftAnchored = sub.left !== 'auto' && sub.left !== undefined;
                                     // Center-origin strategy: Start from 50%, animate to final
                                     return ( 
                                        <motion.div 
                                            key={sub.key} 
                                            initial={{ opacity: 0, left: '50%', top: '50%', x: '-50%', y: '-50%', scale: 0, z: 0 }} 
                                            animate={{ opacity: 1, left: sub.left, top: sub.top, rotate: sub.rotate, scale: 1.2 * sub.scale, x: !isMobile ? 15 : (sub.key === 'gp' ? -15 : 15), y: 0, z: 60 }} 
                                            whileHover={{ zIndex: 500, scale: 1.3 * sub.scale }} 
                                            exit={{ opacity: 0, scale: 0, left: '50%', top: '50%', x: '-50%', y: '-50%' }} 
                                            transition={{ ...morphTransition, delay: i * 0.03 }} 
                                            style={{ position: 'absolute', right: sub.right, transformOrigin: 'center', cursor: 'default' }}
                                        > 
                                            <div className={`${styles.genrePill} no-underline`} style={{ flexDirection: 'row' }}> 
                                                <sub.Icon style={{ width: '16px', height: '16px' }} /> 
                                                <span style={{ fontSize: '1.1rem' }}>{sub.name}</span> 
                                            </div> 
                                        </motion.div> 
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Satellites */}
                    {isFlyingTagsEnabled && (
                        <div className={styles.satelliteField}>
                            <AnimatePresence>
                                {isHovered && flyingItems.map((item, i) => {
                                    if (!item) return null;
                                    const pillStyleClass = item.colorClass ? `${styles.shardPill} ${styles.statusPill} ${styles[item.colorClass]}` : styles.shardPill;
                                    const config = { hoverX: item.x, hoverY: item.y, rotate: item.rotate }; 
                                    let positionStyle = { left: '50%', right: 'auto', top: '50%', transformOrigin: 'center' };
                                    if (item.anchor === 'left') { positionStyle = { right: 'auto', left: '0%', top: '50%', transformOrigin: 'center left' }; } else if (item.anchor === 'right') { positionStyle = { right: '0%', left: 'auto', top: '50%', transformOrigin: 'center right' }; }

                                    let initialX = 0;
                                    if (item.anchor === 'left') initialX = 160;
                                    if (item.anchor === 'right') initialX = -160;

                                    return ( 
                                        <motion.div 
                                            key={`shard-${i}`} 
                                            className={styles.satelliteShard} 
                                            initial={{ opacity: 0, scale: 0.4, x: initialX, y: 0, z: 0 }} 
                                            animate={{ opacity: 1, scale: 1.1 * item.scale, x: config.hoverX, y: config.hoverY, rotate: config.rotate, z: 60 }} 
                                            whileHover={{ zIndex: 500, scale: 1.2 * item.scale }} 
                                            exit={{ opacity: 0, scale: 0.4, x: initialX, y: 0 }} 
                                            transition={{ ...morphTransition, delay: i * 0.05 }} 
                                            style={{ position: 'absolute', ...positionStyle, transformStyle: 'preserve-3d' }}
                                            onClick={(e) => e.stopPropagation()}
                                        > 
                                            {item.link ? (
                                                <Link 
                                                    href={item.link} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`${pillStyleClass} no-underline`}
                                                    style={{ gap: '0.4rem', cursor: 'pointer' }}
                                                    prefetch={false}
                                                >
                                                    {item.type === 'clickHint' ? (
                                                        <>
                                                            {item.icon && <span style={{display: 'flex'}}>{item.icon}</span>}
                                                            {item.label}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {item.icon && <span style={{display: 'flex'}}>{item.icon}</span>}
                                                            {item.label}
                                                        </>
                                                    )}
                                                </Link>
                                            ) : (
                                                <div className={pillStyleClass} style={{ gap: '0.4rem' }}>
                                                    {item.icon && <span style={{display: 'flex'}}>{item.icon}</span>}
                                                    {item.label}
                                                </div> 
                                            )}
                                        </motion.div> 
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                </div>
            </motion.div>
        </>
    );
};

const TimelineCard = memo(TimelineCardComponent);
export default TimelineCard;