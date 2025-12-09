// components/studio/social/shared/SpaceBackground.tsx
import React from 'react';

// --- ADJUST BRIGHTNESS HERE ---
// 1.0 is default. 0.5 is darker, 1.5 is brighter.
const BACKGROUND_BRIGHTNESS = 0.8; 

export default function SpaceBackground() {
    return (
        <g style={{ filter: `brightness(${BACKGROUND_BRIGHTNESS})` }}>
            <defs>
                {/* 1. FILTERS & GRADIENTS */}
                
                {/* STELLAR BLOOM */}
                <filter id="sb_stellarBloom">
                    <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>

                {/* CRYSTALLINE GRIT (Noise) */}
                <filter id="sb_crystallineGrit">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                    <feColorMatrix type="saturate" values="0"></feColorMatrix>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.1"></feFuncA>
                    </feComponentTransfer>
                </filter>

                {/* SHARD GRADIENT: WHITE */}
                <linearGradient id="sb_shardGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30"></stop>
                    <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.10"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                </linearGradient>

                {/* SHARD GRADIENT: ETERNAL CYAN */}
                <linearGradient id="sb_shardGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.35"></stop>
                    <stop offset="50%" stopColor="#00FFF0" stopOpacity="0.1"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                </linearGradient>

                {/* ATMOSPHERE GRADIENTS */}
                <radialGradient id="sb_nebulaTop" cx="50%" cy="0%" r="80%">
                    <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.12"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                </radialGradient>
                <radialGradient id="sb_nebulaBottom" cx="10%" cy="100%" r="60%">
                    <stop offset="0%" stopColor="#556070" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                </radialGradient>
                <radialGradient id="sb_nebulaRight" cx="95%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.08"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                </radialGradient>

                {/* SCRATCHES (Removed Scanlines) */}
                <pattern id="sb_scratchPattern" x="0" y="0" width="500" height="500" patternUnits="userSpaceOnUse">
                    <path d="M 50 50 L 80 80 M 200 100 L 220 90 M 350 300 L 360 320 M 100 300 L 80 320" stroke="#FFF" strokeWidth="0.5" opacity="0.15" strokeLinecap="square"></path>
                    <path d="M 400 50 L 420 80 M 10 400 L 30 380" stroke="#FFF" strokeWidth="0.5" opacity="0.1"></path>
                </pattern>

                {/* CONSTELLATION ASSETS */}
                <g id="sb_star"><circle r="1.5" fill="#F0F0FF"></circle></g>
                <g id="sb_c_A"><path d="M0,0 L30,40 L-20,30 Z" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="30" y="40"></use><use href="#sb_star" x="-20" y="30"></use></g>
                <g id="sb_c_B"><path d="M0,0 L40,0 L80,0" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="40" y="0"></use><use href="#sb_star" x="80" y="0"></use></g>
                <g id="sb_c_C"><path d="M0,0 L0,40 L30,60" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="0" y="40"></use><use href="#sb_star" x="30" y="60"></use></g>
                <g id="sb_c_D"><path d="M0,0 L20,30 M20,30 L0,60 M20,30 L40,60" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="20" y="30"></use><use href="#sb_star" x="0" y="60"></use><use href="#sb_star" x="40" y="60"></use></g>
                <g id="sb_c_E"><path d="M0,0 L40,10 L30,50 L-10,40 Z" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="40" y="10"></use><use href="#sb_star" x="30" y="50"></use><use href="#sb_star" x="-10" y="40"></use></g>
                <g id="sb_c_F"><path d="M0,0 L30,20 L0,40 L30,60" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="30" y="20"></use><use href="#sb_star" x="0" y="40"></use><use href="#sb_star" x="30" y="60"></use></g>
                <g id="sb_c_G"><path d="M0,20 L40,20 M40,20 L20,0 M40,20 L20,40" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="20"></use><use href="#sb_star" x="40" y="20"></use><use href="#sb_star" x="20" y="0"></use><use href="#sb_star" x="20" y="40"></use></g>
                <g id="sb_c_H"><path d="M0,0 L30,10 L60,30 L90,60" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="30" y="10"></use><use href="#sb_star" x="60" y="30"></use><use href="#sb_star" x="90" y="60"></use></g>
                <g id="sb_c_I"><path d="M0,0 L20,0 L10,15 Z" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="20" y="0"></use><use href="#sb_star" x="10" y="15"></use></g>
                <g id="sb_c_J"><path d="M20,0 L20,40 M0,20 L40,20" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="20" y="0"></use><use href="#sb_star" x="20" y="40"></use><use href="#sb_star" x="0" y="20"></use><use href="#sb_star" x="40" y="20"></use><use href="#sb_star" x="20" y="20"></use></g>
                <g id="sb_c_K"><path d="M0,0 L30,10 L60,10 L80,30 L50,40 L30,10" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="0" y="0"></use><use href="#sb_star" x="30" y="10"></use><use href="#sb_star" x="60" y="10"></use><use href="#sb_star" x="80" y="30"></use><use href="#sb_star" x="50" y="40"></use></g>
                <g id="sb_c_L"><path d="M10,0 L30,0 L40,17 L30,34 L10,34" stroke="#556070" strokeWidth="0.5" fill="none"></path><use href="#sb_star" x="10" y="0"></use><use href="#sb_star" x="30" y="0"></use><use href="#sb_star" x="40" y="17"></use><use href="#sb_star" x="30" y="34"></use><use href="#sb_star" x="10" y="34"></use></g>

                <pattern id="sb_ultraDenseSpace" x="0" y="0" width="800" height="800" patternUnits="userSpaceOnUse">
                    <use href="#sb_c_A" x="50" y="50" opacity="0.6"></use><use href="#sb_c_B" x="150" y="80" transform="rotate(20 150 80)" opacity="0.4"></use><use href="#sb_c_C" x="50" y="150" opacity="0.5"></use><use href="#sb_c_D" x="250" y="40" transform="rotate(90 250 40)" opacity="0.3"></use><use href="#sb_c_E" x="350" y="100" opacity="0.5"></use><use href="#sb_c_F" x="200" y="200" opacity="0.4"></use><use href="#sb_c_G" x="300" y="250" transform="rotate(45 300 250)" opacity="0.6"></use><use href="#sb_c_H" x="100" y="280" opacity="0.3"></use><use href="#sb_c_I" x="10" y="220" opacity="0.5"></use><use href="#sb_c_J" x="380" y="200" opacity="0.4"></use><use href="#sb_c_K" x="120" y="350" opacity="0.3"></use><use href="#sb_c_L" x="300" y="350" opacity="0.5"></use><use href="#sb_c_A" x="20" y="350" transform="rotate(180 20 350)" opacity="0.4"></use>
                    <use href="#sb_c_B" x="500" y="50" opacity="0.5"></use><use href="#sb_c_C" x="600" y="80" transform="rotate(-30 600 80)" opacity="0.4"></use><use href="#sb_c_D" x="700" y="40" opacity="0.6"></use><use href="#sb_c_E" x="450" y="150" opacity="0.3"></use><use href="#sb_c_F" x="650" y="180" transform="rotate(60 650 180)" opacity="0.5"></use><use href="#sb_c_G" x="550" y="220" opacity="0.4"></use><use href="#sb_c_H" x="750" y="250" opacity="0.3"></use><use href="#sb_c_I" x="480" y="300" opacity="0.5"></use><use href="#sb_c_J" x="600" y="320" transform="rotate(15 600 320)" opacity="0.6"></use><use href="#sb_c_K" x="700" y="350" opacity="0.4"></use><use href="#sb_c_L" x="500" y="380" opacity="0.3"></use><use href="#sb_c_A" x="780" y="150" opacity="0.5"></use><use href="#sb_c_C" x="420" y="50" opacity="0.4"></use>
                    <use href="#sb_c_D" x="50" y="450" opacity="0.5"></use><use href="#sb_c_E" x="150" y="500" transform="rotate(10 150 500)" opacity="0.4"></use><use href="#sb_c_F" x="50" y="600" opacity="0.6"></use><use href="#sb_c_G" x="250" y="450" opacity="0.3"></use><use href="#sb_c_H" x="350" y="500" transform="rotate(90 350 500)" opacity="0.5"></use><use href="#sb_c_I" x="200" y="600" opacity="0.4"></use><use href="#sb_c_J" x="300" y="650" opacity="0.5"></use><use href="#sb_c_K" x="100" y="680" opacity="0.3"></use><use href="#sb_c_L" x="10" y="750" opacity="0.6"></use><use href="#sb_c_A" x="150" y="750" transform="rotate(-45 150 750)" opacity="0.4"></use><use href="#sb_c_B" x="300" y="750" opacity="0.5"></use><use href="#sb_c_C" x="380" y="550" opacity="0.3"></use><use href="#sb_c_F" x="20" y="500" opacity="0.4"></use>
                    <use href="#sb_c_D" x="500" y="450" opacity="0.6"></use><use href="#sb_c_E" x="650" y="480" transform="rotate(30 650 480)" opacity="0.4"></use><use href="#sb_c_F" x="750" y="450" opacity="0.5"></use><use href="#sb_c_G" x="550" y="550" opacity="0.3"></use><use href="#sb_c_H" x="700" y="600" opacity="0.4"></use><use href="#sb_c_I" x="450" y="650" transform="rotate(120 450 650)" opacity="0.5"></use><use href="#sb_c_J" x="600" y="700" opacity="0.6"></use><use href="#sb_c_K" x="750" y="700" opacity="0.3"></use><use href="#sb_c_L" x="500" y="750" opacity="0.5"></use><use href="#sb_c_A" x="650" y="780" transform="rotate(180 650 780)" opacity="0.4"></use><use href="#sb_c_B" x="550" y="620" opacity="0.5"></use><use href="#sb_c_C" x="780" y="550" opacity="0.3"></use><use href="#sb_c_F" x="420" y="780" opacity="0.4"></use>
                    <g fill="#F0F0FF" opacity="0.2"><circle cx="20" cy="20" r="1"></circle> <circle cx="200" cy="50" r="0.8"></circle><circle cx="400" cy="10" r="1.2"></circle> <circle cx="600" cy="80" r="1"></circle><circle cx="780" cy="20" r="0.8"></circle> <circle cx="100" cy="400" r="1"></circle><circle cx="300" cy="450" r="1.2"></circle> <circle cx="500" cy="420" r="0.8"></circle><circle cx="700" cy="450" r="1"></circle> <circle cx="20" cy="700" r="1.2"></circle><circle cx="250" cy="780" r="0.8"></circle> <circle cx="550" cy="700" r="1"></circle><circle cx="750" cy="780" r="1.2"></circle> <circle cx="400" cy="200" r="1"></circle></g>
                </pattern>

                {/* VIGNETTE */}
                <radialGradient id="sb_vignette" cx="50%" cy="50%" r="80%">
                    <stop offset="60%" stopColor="#10121A" stopOpacity="0"></stop>
                    <stop offset="100%" stopColor="#10121A" stopOpacity="0.9"></stop>
                </radialGradient>
            </defs>

            {/* 1. BASE BACKGROUND */}
            <rect width="100%" height="100%" fill="#10121A"></rect>

            {/* 2. ATMOSPHERE */}
            <rect width="100%" height="100%" fill="url(#sb_nebulaTop)" style={{ mixBlendMode: 'screen' }}></rect>
            <rect width="100%" height="100%" fill="url(#sb_nebulaBottom)" style={{ mixBlendMode: 'screen' }}></rect>
            <rect width="100%" height="100%" fill="url(#sb_nebulaRight)" style={{ mixBlendMode: 'screen' }}></rect>

            {/* 3. STAR CHART LAYERS */}
            <rect width="100%" height="100%" fill="url(#sb_ultraDenseSpace)" opacity="0.4"></rect>
            <g transform="translate(960, 540) rotate(45) translate(-960, -540)">
                <rect x="-1000" y="-1000" width="4000" height="4000" fill="url(#sb_ultraDenseSpace)" opacity="0.25"></rect>
            </g>
            <g transform="scale(0.6)">
                <rect width="200%" height="200%" fill="url(#sb_ultraDenseSpace)" opacity="0.2"></rect>
            </g>

            {/* 4. SHARDS */}
            <g style={{ mixBlendMode: 'soft-light' }}>
                {/* GROUP A: WHITE SHARDS */}
                <g fill="url(#sb_shardGradWhite)" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5">
                    <path d="M 120 120 L 320 160 L 220 320 L 80 260 Z" opacity="0.7"></path>
                    <path d="M -20 600 L 220 640 L 120 820 L 40 780 Z" opacity="0.5"></path>
                    <path d="M 1450 880 L 1650 920 L 1550 1060 L 1320 1020 Z" opacity="0.8"></path>
                    <path d="M 750 80 L 950 120 L 850 280 Z" opacity="0.4"></path>
                    <path d="M 850 920 L 1050 880 L 1150 1020 L 900 980 Z" opacity="0.6"></path>
                    <path d="M 1550 480 L 1750 520 L 1700 680 Z" opacity="0.5"></path>
                    <path d="M 450 420 L 650 460 L 550 620 Z" opacity="0.3"></path>
                </g>

                {/* GROUP B: CYAN SHARDS */}
                <g fill="url(#sb_shardGradCyan)" stroke="#00FFF0" strokeOpacity="0.4" strokeWidth="1.5">
                    <path d="M 1580 120 L 1780 80 L 1820 320 L 1620 280 Z" opacity="0.8"></path>
                    <path d="M 1200 320 L 1380 280 L 1420 500 L 1250 450 Z" opacity="0.6"></path>
                    <path d="M 150 900 L 350 860 L 300 1040 Z" opacity="0.7"></path>
                </g>
            </g>

            {/* 5. STELLAR FLARES */}
            <g filter="url(#sb_stellarBloom)">
                <circle cx="300" cy="300" r="3" fill="#FFF"></circle>
                <circle cx="1200" cy="150" r="2.5" fill="#FFF"></circle>
                <circle cx="800" cy="800" r="3" fill="#FFF"></circle>
                <circle cx="1500" cy="600" r="2" fill="#FFF"></circle>
                <circle cx="100" cy="1000" r="2.2" fill="#FFF"></circle>
                <circle cx="1800" cy="200" r="2.8" fill="#FFF"></circle>
                <circle cx="900" cy="50" r="3" fill="#FFF"></circle>
                <circle cx="500" cy="950" r="2.5" fill="#FFF"></circle>
                <circle cx="50" cy="500" r="2" fill="#FFF"></circle>
                <circle cx="1300" cy="900" r="3.2" fill="#FFF"></circle>
                <circle cx="1000" cy="100" r="2.5" fill="#FFF"></circle>
                <circle cx="1600" cy="800" r="2.8" fill="#FFF"></circle>
                <circle cx="500" cy="200" r="3" fill="#00FFF0" opacity="0.8"></circle>
                <circle cx="1000" cy="500" r="4" fill="#00FFF0" opacity="0.6"></circle>
                <circle cx="200" cy="800" r="3" fill="#00FFF0" opacity="0.7"></circle>
                <circle cx="1700" cy="900" r="3.5" fill="#00FFF0" opacity="0.8"></circle>
                <circle cx="1400" cy="300" r="2" fill="#00FFF0" opacity="0.9"></circle>
                <circle cx="100" cy="200" r="2.5" fill="#00FFF0" opacity="0.7"></circle>
                <circle cx="600" cy="600" r="3.2" fill="#00FFF0" opacity="0.8"></circle>
                <circle cx="1100" cy="800" r="2.8" fill="#00FFF0" opacity="0.6"></circle>
                <circle cx="1850" cy="500" r="3" fill="#00FFF0" opacity="0.9"></circle>
                <circle cx="250" cy="400" r="2.2" fill="#00FFF0" opacity="0.7"></circle>
                <circle cx="900" cy="900" r="3.5" fill="#00FFF0" opacity="0.8"></circle>
                <circle cx="1200" cy="600" r="2.8" fill="#00FFF0" opacity="0.7"></circle>
                <circle cx="50" cy="50" r="3" fill="#00FFF0" opacity="0.9"></circle>
            </g>

            {/* 6. MICRO-SCRATCHES */}
            <rect width="100%" height="100%" fill="url(#sb_scratchPattern)" opacity="0.4"></rect>

            {/* 7. VIGNETTE */}
            <rect width="100%" height="100%" fill="url(#sb_vignette)"></rect>

            {/* 8. FILM GRAIN */}
            <rect width="100%" height="100%" fill="transparent" filter="url(#sb_crystallineGrit)" opacity="0.7" style={{ mixBlendMode: 'overlay', pointerEvents: 'none' }}></rect>
        </g>
    );
}