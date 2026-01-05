// components/studio/social/review-card/ReviewCardPlatforms.tsx
'use client';

import React from 'react';
import { ReviewTemplateData } from './types';
import { PLATFORM_ICONS } from './utils';

interface ReviewCardPlatformsProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardPlatforms({ data, onDataChange }: ReviewCardPlatformsProps) {
    
    // --- LAYOUT CONFIGURATION ---
    const SIZE_SCALE = 1.25;
    const START_X_POS = 625;
    const ITEM_SPACING = 100;
    const Y_POS = 1270;
    
    // Controls the horizontal centering of the icon within its slot
    const ICON_X_OFFSET = -19; 
    
    // Controls how high the light beam goes and where the icon sits
    const LIGHT_FARNESS = 55; 

    const handlePlatformToggle = (key: keyof typeof data.platforms) => {
        onDataChange({ platforms: { ...data.platforms, [key]: !data.platforms[key] } });
    };

    const platformsList = ['PC', 'PS5', 'XSX', 'NSW'] as const;

    // Derived geometry based on farness
    const beamHeight = LIGHT_FARNESS + 10;
    const scanlineY = LIGHT_FARNESS / 2;

    return (
        <g transform={`translate(${START_X_POS}, ${Y_POS}) scale(${SIZE_SCALE})`}>
            <g>
                {platformsList.map((key, index) => {
                    const isActive = data.platforms[key];
                    const Icon = PLATFORM_ICONS[key];
                    const opacity = isActive ? 1 : 0.3;
                    
                    // FIXED: Icons should be White when active, Grey when inactive
                    const fillColor = isActive ? "#FFFFFF" : "#556070";
                    
                    // Calculate X position based on spacing
                    const x = index * ITEM_SPACING;

                    return (
                        <g 
                            key={key} 
                            transform={`translate(${x}, 0)`} 
                            onClick={() => handlePlatformToggle(key)} 
                            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                        >
                            {/* --- EMITTER BASE --- */}
                            {/* Mechanical Housing */}
                            <path 
                                d="M -30,20 L -25,10 L 25,10 L 30,20 L 25,30 L -25,30 Z" 
                                fill="#0B0D12" 
                                stroke={isActive ? "#00FFF0" : "#333"} 
                                strokeWidth={isActive ? "2" : "1"}
                            />
                            
                            {/* Glowing Lens Center */}
                            <ellipse 
                                cx="0" cy="10" rx="15" ry="3" 
                                fill={isActive ? "#00FFF0" : "#556070"} 
                                opacity={isActive ? 1 : 0.2}
                                filter={isActive ? "url(#review-cyanGlow)" : "none"}
                            />

                            {/* --- PROJECTION BEAM --- */}
                            <path 
                                d={`M -15,10 L 15,10 L 25,-${beamHeight} L -25,-${beamHeight} Z`}
                                fill="url(#review-beamGradient)" 
                                opacity={isActive ? 0.8 : 0}
                                style={{ mixBlendMode: 'screen' }}
                            />
                            
                            {/* Scanline Effect in Beam */}
                            {isActive && (
                                <path 
                                    d={`M -20,-${scanlineY} L 20,-${scanlineY}`}
                                    stroke="#00FFF0" 
                                    strokeWidth="1" 
                                    opacity="0.3"
                                />
                            )}

                            {/* --- HOLOGRAPHIC ICON --- */}
                            <g 
                                transform={`translate(${ICON_X_OFFSET}, -${LIGHT_FARNESS}) scale(1.6)`} 
                                opacity={opacity}
                                // FIXED: Apply Cyan Drop Shadow for Hologram Effect
                                filter={isActive ? "drop-shadow(0 0 8px rgba(0,255,240,0.8))" : "none"}
                                // FIXED: Explicitly set color style to ensure export picks up the fill correctly
                                style={{ color: fillColor }}
                            >
                                <g fill={fillColor}>
                                    <Icon width="24" height="24" />
                                </g>

                                {/* Brackets (Active Only - Cyan) */}
                                {isActive && (
                                    <g>
                                        {/* Top Left Bracket - Expanded & Refined */}
                                        <path 
                                            d="M -7,5 L -7,-1 L -1,-7 L 5,-7" 
                                            fill="none" 
                                            stroke="#00FFF0" 
                                            strokeWidth="2" 
                                            strokeLinecap="square" 
                                            strokeLinejoin="miter"
                                        />
                                        {/* Bottom Right Bracket - Expanded & Refined */}
                                        <path 
                                            d="M 31,19 L 31,25 L 25,31 L 19,31" 
                                            fill="none" 
                                            stroke="#00FFF0" 
                                            strokeWidth="2" 
                                            strokeLinecap="square" 
                                            strokeLinejoin="miter"
                                        />
                                    </g>
                                )}
                            </g>

                            {/* Active Indicator (Square on corner) */}
                            {isActive && (
                                <rect 
                                    x="-3" y="40" 
                                    width="6" height="6" 
                                    fill="#00FFF0" 
                                    filter="url(#review-cyanGlow)" 
                                    transform="rotate(45 0 43)"
                                />
                            )}
                        </g>
                    );
                })}
            </g>
        </g>
    );
}