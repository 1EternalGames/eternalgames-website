// components/studio/social/review-card/ReviewCardDefs.tsx
import React from 'react';

export default function ReviewCardDefs() {
    return (
        <defs>
            <linearGradient id="review-monolithFade" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#000" stopOpacity="0.9"></stop>
                <stop offset="60%" stopColor="#000" stopOpacity="0.1"></stop>
                <stop offset="100%" stopColor="#000" stopOpacity="0"></stop>
            </linearGradient>
            <linearGradient id="review-glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#151820" stopOpacity="0.95"></stop>
                <stop offset="100%" stopColor="#080A0F" stopOpacity="0.98"></stop>
            </linearGradient>
            <linearGradient id="review-titleHeaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#151820"></stop>
                <stop offset="100%" stopColor="#0B0D12"></stop>
            </linearGradient>
            <linearGradient id="review-proGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.2"></stop>
                <stop offset="100%" stopColor="#00FFF0" stopOpacity="0"></stop>
            </linearGradient>
            
            <linearGradient id="review-conGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FF0055" stopOpacity="0.2"></stop>
                <stop offset="100%" stopColor="#FF0055" stopOpacity="0"></stop>
            </linearGradient>
            <linearGradient id="review-activeModule" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0F1115"></stop>
                <stop offset="100%" stopColor="#050608"></stop>
            </linearGradient>
                <pattern id="review-inactiveModule" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="10" y2="10" stroke="#1A202C" strokeWidth="1" />
            </pattern>
            <pattern id="review-microGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="40" height="40" fill="none" stroke="#1A202C" strokeWidth="1" opacity="0.3"></rect>
                <circle cx="20" cy="20" r="1" fill="#00FFF0" opacity="0.3"></circle>
            </pattern>
            <pattern id="review-hexTech" x="0" y="0" width="20" height="34.64" patternUnits="userSpaceOnUse">
                <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke="#00FFF0" strokeWidth="0.5" opacity="0.1"></path>
            </pattern>
            <filter id="review-cyanGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
                <filter id="review-redGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                <feMerge>
                    <feMergeNode in="coloredBlur"></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
            <filter id="review-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                <feColorMatrix type="saturate" values="0"></feColorMatrix>
            </filter>
            <clipPath id="review-monolithClip">
                <path d="M 0,0 L 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350 L 0,1350 Z"></path>
            </clipPath>
            <clipPath id="review-prismClip">
                <path d="M 40,0 L 460,0 L 460,180 L 420,220 L 0,220 L 0,40 Z"></path>
            </clipPath>
            <clipPath id="review-moduleClip">
                <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z"></path>
            </clipPath>
            <clipPath id="review-titleBodyClip">
                <path d="M 0,0 L 480,0 L 480,90 L 460,110 L 0,110 Z"></path>
            </clipPath>
        </defs>
    );
}