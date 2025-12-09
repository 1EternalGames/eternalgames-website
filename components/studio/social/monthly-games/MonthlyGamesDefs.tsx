// components/studio/social/monthly-games/MonthlyGamesDefs.tsx
import React from 'react';

export default function MonthlyGamesDefs() {
    return (
        <defs>
            <linearGradient id="mg-abyssalDepth" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#0B0D12"></stop>
                <stop offset="40%" stopColor="#10121A"></stop>
                <stop offset="100%" stopColor="#1A1E29"></stop>
            </linearGradient>
            
            <pattern id="mg-techGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#556070" strokeWidth="0.5" opacity="0.1"></path>
                <circle cx="0" cy="0" r="1" fill="#00FFF0" opacity="0.3"></circle>
            </pattern>

            <filter id="mg-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                <feColorMatrix type="matrix" values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.5 1.5"></feColorMatrix>
            </filter>

            <filter id="mg-activeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>

            <linearGradient id="mg-glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#050505" stopOpacity="0"></stop>
                <stop offset="50%" stopColor="#050505" stopOpacity="0.2"></stop>
                <stop offset="85%" stopColor="#050505" stopOpacity="0.9"></stop>
                <stop offset="100%" stopColor="#050505" stopOpacity="0.98"></stop>
            </linearGradient>

            <clipPath id="mg-towerClip">
                {/* Updated path: removed top-left cut (M 0,0) */}
                <path d="M 0,0 L 300,0 L 300,120 L 290,125 L 300,130 L 300,250 L 290,260 L 290,290 L 300,300 L 300,350 L 270,380 L 30,380 L 0,350 L 0,300 L 10,290 L 10,260 L 0,250 L 0,130 L 10,125 L 0,120 Z"></path>
            </clipPath>
            
             <g id="mg-glassDock">
                <line x1="10" y1="0" x2="250" y2="0" stroke="#00FFF0" strokeWidth="1" opacity="0.3"></line>
                <path d="M 10,0 L 10,5" stroke="#00FFF0" strokeWidth="1"></path>
                <path d="M 250,0 L 250,5" stroke="#00FFF0" strokeWidth="1"></path>
                <line x1="52" y1="8" x2="52" y2="28" stroke="#556070" strokeWidth="1" opacity="0.3"></line>
                <line x1="104" y1="8" x2="104" y2="28" stroke="#556070" strokeWidth="1" opacity="0.3"></line>
                <line x1="156" y1="8" x2="156" y2="28" stroke="#556070" strokeWidth="1" opacity="0.3"></line>
                <line x1="208" y1="8" x2="208" y2="28" stroke="#556070" strokeWidth="1" opacity="0.3"></line>
            </g>

            <g id="mg-cyberDateTag">
                <path d="M 0,0 L 60,0 L 60,35 L 45,50 L 0,50 Z" fill="#00FFF0"></path>
                <rect x="0" y="0" width="5" height="50" fill="#050505" opacity="0.3"></rect>
                <rect x="42" y="44" width="8" height="2" fill="#050505" opacity="0.6"></rect>
            </g>
        </defs>
    );
}