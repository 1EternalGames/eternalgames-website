// components/studio/social/weekly-news/WeeklyNewsDefs.tsx
import React from 'react';

export default function WeeklyNewsDefs() {
    return (
        <defs>
            <linearGradient id="wn-cleanVoid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B0D12"></stop>
                <stop offset="100%" stopColor="#050505"></stop>
            </linearGradient>

            <linearGradient id="wn-heroShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="50%" stopColor="#000" stopOpacity="0"></stop>
                <stop offset="100%" stopColor="#000" stopOpacity="0.95"></stop>
            </linearGradient>

            <linearGradient id="wn-cardShadow" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#050505" stopOpacity="0"></stop>
                <stop offset="100%" stopColor="#050505" stopOpacity="0.9"></stop>
            </linearGradient>

            <pattern id="wn-dataStream" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="#00FFF0" opacity="0.3"></circle>
            </pattern>
            <pattern id="wn-techGrid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1A202C" strokeWidth="1"></path>
                <rect x="0" y="0" width="2" height="2" fill="#00FFF0" opacity="0.1"></rect>
            </pattern>

            <filter id="wn-neonGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
            
            <filter id="wn-strongNeonGlow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
            
            {/* Added: Red Glow for Leaks */}
            <filter id="wn-leakGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#DC2626" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            {/* Added: Amber Glow for Rumors */}
            <filter id="wn-rumorGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#F59E0B" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            <filter id="wn-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                <feColorMatrix type="saturate" values="0"></feColorMatrix>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.1"></feFuncA>
                </feComponentTransfer>
            </filter>

            <clipPath id="wn-heroClipNotched">
                <path d="M 0,0 L 1080,0 L 1080,100 L 1065,110 L 1065,150 L 1080,160 L 1080,260 L 1040,300 L 700,300 L 680,320 L 400,320 L 380,300 L 40,300 L 0,260 L 0,160 L 15,150 L 15,110 L 0,100 Z"></path>
            </clipPath>

            <clipPath id="wn-platformClipV2">
                <path d="M 20,0 L 300,0 L 320,20 L 320,140 L 300,160 L 190,160 L 180,150 L 140,150 L 130,160 L 20,160 L 0,140 L 0,20 Z"></path>
            </clipPath>
        </defs>
    );
}


