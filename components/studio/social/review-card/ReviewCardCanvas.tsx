// components/studio/social/review-card/ReviewCardCanvas.tsx
'use client';

import React, { useState } from 'react';
import { ReviewCardCanvasProps } from './types';
import ReviewCardDefs from './ReviewCardDefs';
import ReviewCardFrame from './ReviewCardFrame';
import ReviewCardImage from './ReviewCardImage';
import ReviewCardTitle from './ReviewCardTitle';
import ReviewCardScore from './ReviewCardScore';
import ReviewCardVerdict from './ReviewCardVerdict';
import ReviewCardProsCons from './ReviewCardProsCons';
import ReviewCardPlatforms from './ReviewCardPlatforms';
import SpaceBackground from '../shared/SpaceBackground';

const LOGO_PATH = "M579 0 502 248 446 315 460 388 366 690 483 815 550 734 456 738 541 715 572 678 601 595 586 688 607 658 653 521 629 451 617 540 598 374 642 441 630 111zM237 196 300 413 195 633 186 551 150 619 146 690 133 659 0 911 274 732 260 665 293 719 323 697 314 593 338 660 423 413zM317 739 150 841 185 886 125 856 71 889 200 1052 169 1052 253 1156 254 1079 490 1276 523 1390 529 1295 484 1107 357 1034 328 978 277 978 312 964 369 846 317 868 281 912 290 870 261 870 221 898 278 833zM353 727 335 782 428 860 457 910 457 838zM576 762 490 842 479 919zM610 793 475 965 514 1035 524 1004 606 924zM744 564 744 734 629 826 629 934 682 962 679 972 714 1026 658 987 636 955 598 961 536 1026 602 987 628 985 646 1007 491 1617 728 1150 732 1205 841 1030 775 1062 892 841z";

export default function ReviewCardCanvas({ data, onDataChange, scale = 1, editMode = 'image' }: ReviewCardCanvasProps) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
             const reader = new FileReader();
            reader.onload = (ev) => { if(ev.target?.result) onDataChange({ image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } }); };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };
    
    // Default Vibrance: 100 (1.0)
    const vibranceValue = (data.vibrance ?? 100) / 100;
    
    // Default Opacity: 100 (1.0)
    const creditsOpacityValue = (data.creditsOpacity ?? 100) / 100;

    // Diamond Path Helper
    // Draws a diamond shape centered at cx, cy with size s
    const drawDiamond = (cx: number, cy: number, s: number) => {
        const h = s / 2;
        return `M ${cx},${cy - h} L ${cx + h},${cy} L ${cx},${cy + h} L ${cx - h},${cy} Z`;
    };

    return (
        <div 
            className="canvas-container"
            id="review-card-canvas"
            style={{ 
                width: `${1080 * scale}px`, 
                height: `${1350 * scale}px`,
                transformOrigin: 'top left',
                position: 'relative',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <svg 
                viewBox="0 0 1080 1350" 
                width="100%" 
                height="100%" 
                xmlns="http://www.w3.org/2000/svg" 
                preserveAspectRatio="xMidYMid slice"
                style={{ 
                    backgroundColor: '#050505', 
                    direction: 'ltr',
                    // Apply Global Saturation Here
                    filter: `saturate(${vibranceValue})` 
                }}
            >
                <ReviewCardDefs />
                
                {/* Global Background */}
                <SpaceBackground />
                
                <ReviewCardFrame enChar={data.gameTitleEnBottom ? data.gameTitleEnBottom.charAt(0) : 'R'} />
                
                <ReviewCardImage 
                    data={data} 
                    onDataChange={onDataChange} 
                    scale={scale} 
                    editMode={editMode}
                />

                <ReviewCardTitle 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />
                
                <ReviewCardScore 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardVerdict 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardProsCons 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardPlatforms 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />
                
                {/* --- CREDITS FOOTER (Option 1: Cyber Diamonds) --- */}
                {/* FIXED: Removed rotation transforms. Used explicit diamond paths. */}
                <g transform="translate(45, 1295)" style={{ opacity: creditsOpacityValue }}>
                    {/* Left Diamond: Positioned relative to text start */}
                    <path 
                        d={drawDiamond(35, 25, 12)} 
                        fill="#00FFF0" 
                        filter="url(#review-cyanGlow)" 
                    />
                    
                    {/* Right Diamond: Positioned relative to text end */}
                    <path 
                        d={drawDiamond(385, 25, 12)} 
                        fill="#00FFF0" 
                    />

                    <text 
                        x="210" 
                        y="30" 
                        textAnchor="middle"
                        fill="#00FFF0" 
                        fontSize="16" 
                        fontFamily="'Cairo', sans-serif" 
                        fontWeight="bold" 
                        letterSpacing="1"
                        style={{ filter: "drop-shadow(0 0 5px rgba(0, 255, 240, 0.5))" }}
                    >
                        @1EternalGames // @MoVisionX تصميم
                    </text>
                </g>

                {/* --- BRANDING CORNER (TOP LEFT) --- */}
                <g>
                    <defs>
                        <clipPath id="brandCornerClip">
                            {/* Shape: 125x125 Box with chamfered bottom-right */}
                            <path d="M 0,0 L 125,0 L 125,90 L 90,125 L 0,125 Z" />
                        </clipPath>
                        {/* Modified Gradient: Originates from Top Right (125, 0) */}
                        <radialGradient id="logoBacklight" cx="125" cy="0" r="140" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* 0. Occlusion Layer (Hides card frame borders underneath) */}
                    <path d="M 0,0 L 125,0 L 125,90 L 90,125 L 0,125 Z" fill="#000000" />

                    {/* 1. Background Masked to Shape */}
                    <g clipPath="url(#brandCornerClip)">
                        {/* Scaled SpaceBackground to increase density of stars/nebula */}
                        <g transform="scale(0.6)" style={{ filter: 'brightness(1.6) saturate(1.4)' }}>
                            <SpaceBackground />
                        </g>
                        
                        {/* Cyan Backlight (Top-Right Source) */}
                        <rect x="0" y="0" width="125" height="125" fill="url(#logoBacklight)" />
                    </g>

                    {/* 2. The Border Frame (Bottom & Right Only - Top/Left Borderless) */}
                    <path 
                        d="M 0,125 L 90,125 L 125,90 L 125,0" 
                        fill="none" 
                        stroke="#00FFF0" 
                        strokeWidth="3"
                        filter="url(#review-cyanGlow)"
                    />
                    
                    {/* Inner Tech Accent Line (Inset) */}
                    <path 
                        d="M 6,119 L 88,119 L 119,88 L 119,6" 
                        fill="none" 
                        stroke="#00FFF0" 
                        strokeWidth="1"
                        opacity="0.6"
                    />

                    {/* 3. The Logo */}
                    <g transform="translate(38, 25) scale(0.045)">
                        <path fill="#00FFF0" d={LOGO_PATH} filter="url(#review-cyanGlow)" />
                    </g>
                </g>

            </svg>
        </div>
    );
}