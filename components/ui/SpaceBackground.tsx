// components/ui/SpaceBackground.tsx
'use client';

import React from 'react';

// Configuration
const BACKGROUND_BRIGHTNESS = 0.8;
const STAR_DENSITY = 0.3; // 30% of stars

// Reusing star positions from studio templates
const STAR_POSITIONS = [
    { id: 'A', x: 50, y: 50, r: 0, o: 0.8 }, { id: 'B', x: 150, y: 80, r: 20, o: 0.7 }, { id: 'C', x: 50, y: 150, r: 0, o: 0.8 },
    { id: 'D', x: 250, y: 40, r: 90, o: 0.5 }, { id: 'E', x: 350, y: 100, r: 0, o: 0.7 }, { id: 'F', x: 200, y: 200, r: 0, o: 0.6 },
    { id: 'G', x: 300, y: 250, r: 45, o: 0.8 }, { id: 'H', x: 100, y: 280, r: 0, o: 0.5 }, { id: 'I', x: 10, y: 220, r: 0, o: 0.7 },
    { id: 'J', x: 380, y: 200, r: 0, o: 0.6 }, { id: 'K', x: 120, y: 350, r: 0, o: 0.5 }, { id: 'L', x: 300, y: 350, r: 0, o: 0.7 },
    { id: 'A', x: 20, y: 350, r: 180, o: 0.6 }, { id: 'B', x: 500, y: 50, r: 0, o: 0.7 }, { id: 'C', x: 600, y: 80, r: -30, o: 0.6 },
    { id: 'D', x: 700, y: 40, r: 0, o: 0.8 }, { id: 'E', x: 450, y: 150, r: 0, o: 0.5 }, { id: 'F', x: 650, y: 180, r: 60, o: 0.7 },
    { id: 'G', x: 550, y: 220, r: 0, o: 0.6 }, { id: 'H', x: 750, y: 250, r: 0, o: 0.5 }, { id: 'I', x: 480, y: 300, r: 0, o: 0.7 },
    { id: 'J', x: 600, y: 320, r: 15, o: 0.8 }, { id: 'K', x: 700, y: 350, r: 0, o: 0.6 }, { id: 'L', x: 500, y: 380, r: 0, o: 0.5 },
    { id: 'A', x: 780, y: 150, r: 0, o: 0.7 }, { id: 'C', x: 420, y: 50, r: 0, o: 0.6 }, { id: 'D', x: 50, y: 450, r: 0, o: 0.7 },
    { id: 'E', x: 150, y: 500, r: 10, o: 0.6 }, { id: 'F', x: 50, y: 600, r: 0, o: 0.8 }, { id: 'G', x: 250, y: 450, r: 0, o: 0.5 },
    { id: 'H', x: 350, y: 500, r: 90, o: 0.7 }, { id: 'I', x: 200, y: 600, r: 0, o: 0.6 }, { id: 'J', x: 300, y: 650, r: 0, o: 0.7 },
    { id: 'K', x: 100, y: 680, r: 0, o: 0.5 }, { id: 'L', x: 10, y: 750, r: 0, o: 0.8 }, { id: 'A', x: 150, y: 750, r: -45, o: 0.6 },
    { id: 'B', x: 300, y: 750, r: 0, o: 0.7 }, { id: 'C', x: 380, y: 550, r: 0, o: 0.5 }, { id: 'F', x: 20, y: 500, r: 0, o: 0.6 },
    { id: 'D', x: 500, y: 450, r: 0, o: 0.8 }, { id: 'E', x: 650, y: 480, r: 30, o: 0.6 }, { id: 'F', x: 750, y: 450, r: 0, o: 0.7 },
    { id: 'G', x: 550, y: 550, r: 0, o: 0.5 }, { id: 'H', x: 700, y: 600, r: 0, o: 0.6 }, { id: 'I', x: 450, y: 650, r: 120, o: 0.7 },
    { id: 'J', x: 600, y: 700, r: 0, o: 0.8 }, { id: 'K', x: 750, y: 700, r: 0, o: 0.5 }, { id: 'L', x: 500, y: 750, r: 0, o: 0.7 },
    { id: 'A', x: 650, y: 780, r: 180, o: 0.6 }, { id: 'B', x: 550, y: 620, r: 0, o: 0.7 }, { id: 'C', x: 780, y: 550, r: 0, o: 0.5 },
    { id: 'F', x: 420, y: 780, r: 0, o: 0.6 }
];

export default function SpaceBackground() {
    const visibleStars = STAR_POSITIONS.filter((_, i) => ((i * 2654435761) % 100) < (STAR_DENSITY * 100));

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1000, pointerEvents: 'none', filter: `brightness(${BACKGROUND_BRIGHTNESS})` }}>
            <svg 
                width="100%" 
                height="100%" 
                xmlns="http://www.w3.org/2000/svg" 
                preserveAspectRatio="none"
                style={{ backgroundColor: '#050505' }}
            >
                <defs>
                    <filter id="gsb_stellarBloom">
                        <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                    </filter>

                    <filter id="gsb_crystallineGrit">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                        <feColorMatrix type="saturate" values="0"></feColorMatrix>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.05"></feFuncA>
                        </feComponentTransfer>
                    </filter>

                    <radialGradient id="gsb_nebulaTop" cx="50%" cy="0%" r="80%">
                        <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.08"></stop>
                        <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                    </radialGradient>
                    <radialGradient id="gsb_nebulaBottom" cx="10%" cy="100%" r="60%">
                        <stop offset="0%" stopColor="#556070" stopOpacity="0.15"></stop>
                        <stop offset="100%" stopColor="#10121A" stopOpacity="0"></stop>
                    </radialGradient>

                    <pattern id="gsb_scratchPattern" x="0" y="0" width="500" height="500" patternUnits="userSpaceOnUse">
                        <path d="M 50 50 L 80 80 M 200 100 L 220 90 M 350 300 L 360 320 M 100 300 L 80 320" stroke="#FFF" strokeWidth="0.5" opacity="0.1" strokeLinecap="square"></path>
                    </pattern>

                    {/* CONSTELLATION ASSETS */}
                    <g id="gsb_star"><circle r="1.5" fill="#F0F0FF"></circle></g>
                    <g id="gsb_c_A"><path d="M0,0 L30,40 L-20,30 Z" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="30" y="40"></use><use href="#gsb_star" x="-20" y="30"></use></g>
                    <g id="gsb_c_B"><path d="M0,0 L40,0 L80,0" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="40" y="0"></use><use href="#gsb_star" x="80" y="0"></use></g>
                    <g id="gsb_c_C"><path d="M0,0 L0,40 L30,60" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="0" y="40"></use><use href="#gsb_star" x="30" y="60"></use></g>
                    <g id="gsb_c_D"><path d="M0,0 L20,30 M20,30 L0,60 M20,30 L40,60" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="20" y="30"></use><use href="#gsb_star" x="0" y="60"></use><use href="#gsb_star" x="40" y="60"></use></g>
                    <g id="gsb_c_E"><path d="M0,0 L40,10 L30,50 L-10,40 Z" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="40" y="10"></use><use href="#gsb_star" x="30" y="50"></use><use href="#gsb_star" x="-10" y="40"></use></g>
                    <g id="gsb_c_F"><path d="M0,0 L30,20 L0,40 L30,60" stroke="#8899AA" strokeWidth="0.5" fill="none"></path><use href="#gsb_star" x="0" y="0"></use><use href="#gsb_star" x="30" y="20"></use><use href="#gsb_star" x="0" y="40"></use><use href="#gsb_star" x="30" y="60"></use></g>

                    <pattern id="gsb_ultraDenseSpace" x="0" y="0" width="800" height="800" patternUnits="userSpaceOnUse">
                        {visibleStars.map((s, i) => (
                            <use 
                                key={i} 
                                href={`#gsb_c_${s.id}`} 
                                x={s.x} 
                                y={s.y} 
                                transform={`rotate(${s.r} ${s.x} ${s.y})`} 
                                opacity={s.o} 
                            />
                        ))}
                    </pattern>
                </defs>

                {/* 1. BASE */}
                <rect width="100%" height="100%" fill="#10121A"></rect>

                {/* 2. ATMOSPHERE */}
                <rect width="100%" height="100%" fill="url(#gsb_nebulaTop)" style={{ mixBlendMode: 'screen' }}></rect>
                <rect width="100%" height="100%" fill="url(#gsb_nebulaBottom)" style={{ mixBlendMode: 'screen' }}></rect>

                {/* 3. STARS */}
                <rect width="100%" height="100%" fill="url(#gsb_ultraDenseSpace)" opacity="0.6"></rect>
                
                {/* 4. GRAIN & VIGNETTE */}
                <rect width="100%" height="100%" fill="url(#gsb_scratchPattern)" opacity="0.3"></rect>
                <rect width="100%" height="100%" fill="transparent" filter="url(#gsb_crystallineGrit)" opacity="0.7" style={{ mixBlendMode: 'overlay' }}></rect>
            </svg>
        </div>
    );
}