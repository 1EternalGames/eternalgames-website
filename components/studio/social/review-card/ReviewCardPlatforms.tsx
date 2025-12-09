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

export default function ReviewCardPlatforms({ data, onDataChange, editingField, setEditingField }: ReviewCardPlatformsProps) {
    
    const handlePlatformToggle = (key: keyof typeof data.platforms) => {
        onDataChange({ platforms: { ...data.platforms, [key]: !data.platforms[key] } });
    };

    // Helper to determine opacity based on active state
    const getOpacity = (key: keyof typeof data.platforms) => data.platforms[key] ? 1 : 0.3;
    const getFilter = (key: keyof typeof data.platforms) => data.platforms[key] ? "url(#platformGlow)" : "none";

    return (
        <g transform="translate(580, 1100)">
            
            {/* B. THE FLAT TECH PLATE */}
            <g transform="translate(0, 40) scale(0.8)">
                
                <g transform="translate(0, 130)">
                    
                    {/* 1. The 2D Base Plate (Chamfered Rect) */}
                    <path d="M 0,0 L 600,0 L 600,40 L 580,60 L 20,60 L 0,40 Z" 
                          fill="url(#review-titleHeaderGradient)" stroke="#556070" strokeWidth="1"/>
                    
                    {/* 2. Cyan Highlights (Corners & Sides) */}
                    <path d="M 0,0 L 0,40 L 20,60" fill="none" stroke="#00FFF0" strokeWidth="3" filter="url(#review-cyanGlow)" />
                    <path d="M 600,0 L 600,40 L 580,60" fill="none" stroke="#00FFF0" strokeWidth="3" filter="url(#review-cyanGlow)" />
                          
                    {/* 3. Hex Pattern Overlay */}
                    <rect x="0" y="0" width="600" height="60" fill="url(#review-hexTech)" clipPath="url(#review-baseClip)" opacity="0.3"/>
                    
                    {/* C. HOLOGRAPHIC PROJECTIONS */}
                    
                    {/* 1. PC */}
                    <g transform="translate(80, 0)" onClick={() => handlePlatformToggle('PC')} style={{ cursor: 'pointer', opacity: getOpacity('PC') }}>
                        {/* Beam */}
                        <path d="M -35,-90 L 35,-90 L 25,0 L -25,0 Z" fill="url(#review-beamGradient)"/>
                        
                        {/* FLAT LIGHT SOURCE */}
                        <rect x="-20" y="-1" width="40" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)" />
                        
                        {/* Icon */}
                        <g transform="translate(-24, -80) scale(2.0)" fill="#FFFFFF" mask="url(#review-holoMask)" filter={getFilter('PC')}>
                            <path d="M4 2H20C21.1 2 22 2.9 22 4V16C22 17.1 21.1 18 20 18H13V20H15V22H9V20H11V18H4C2.9 18 2 17.1 2 16V4C2 2.9 2.9 2 4 2M4 4V16H20V4H4Z" />
                        </g>
                        {/* Name */}
                        <text x="0" y="35" textAnchor="middle" fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF">PC</text>
                    </g>

                    {/* 2. PS5 */}
                    <g transform="translate(220, 0)" onClick={() => handlePlatformToggle('PS5')} style={{ cursor: 'pointer', opacity: getOpacity('PS5') }}>
                        <path d="M -35,-90 L 35,-90 L 25,0 L -25,0 Z" fill="url(#review-beamGradient)"/>
                        <rect x="-20" y="-1" width="40" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)" />

                        <g transform="translate(-24, -80) scale(1.5)" fill="#FFFFFF" mask="url(#review-holoMask)" filter={getFilter('PS5')}>
                            <path d="M3.262 24.248c-2.374-0.681-2.767-2.084-1.69-2.899 0.776-0.51 1.668-0.954 2.612-1.288l0.087-0.027 7.017-2.516v2.89l-5.030 1.839c-0.881 0.339-1.031 0.79-0.299 1.032 0.365 0.093 0.783 0.147 1.214 0.147 0.615 0 1.204-0.109 1.749-0.308l-0.035 0.011 2.422-0.882v2.592c-0.15 0.037-0.32 0.055-0.487 0.091-0.775 0.136-1.667 0.214-2.577 0.214-1.778 0-3.486-0.298-5.078-0.846l0.11 0.033zM18.049 24.544l7.868-2.843c0.893-0.322 1.032-0.781 0.307-1.022-0.363-0.089-0.779-0.14-1.208-0.14-0.622 0-1.22 0.108-1.774 0.305l0.037-0.011-5.255 1.874v-2.983l0.3-0.106c1.050-0.349 2.284-0.62 3.557-0.761l0.083-0.008c0.468-0.050 1.010-0.078 1.559-0.078 1.877 0 3.677 0.331 5.343 0.939l-0.108-0.035c2.309 0.751 2.549 1.839 1.969 2.589-0.559 0.557-1.235 0.998-1.988 1.282l-0.039 0.013-10.677 3.883v-2.869zM12.231 4.248v21.927l4.892 1.576v-18.39c0-0.862 0.38-1.438 0.992-1.238 0.795 0.225 0.95 1.017 0.95 1.881v7.342c3.050 1.491 5.451-0.003 5.451-3.939 0-4.045-1.407-5.842-5.546-7.282-1.785-0.648-4.040-1.294-6.347-1.805l-0.389-0.072z" />
                        </g>
                        <text x="0" y="35" textAnchor="middle" fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF">PS5</text>
                    </g>

                    {/* 3. XBOX */}
                    <g transform="translate(360, 0)" onClick={() => handlePlatformToggle('XSX')} style={{ cursor: 'pointer', opacity: getOpacity('XSX') }}>
                        <path d="M -35,-90 L 35,-90 L 25,0 L -25,0 Z" fill="url(#review-beamGradient)"/>
                        <rect x="-20" y="-1" width="40" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)" />

                        <g transform="translate(-24, -80) scale(1.5)" fill="#FFFFFF" mask="url(#review-holoMask)" filter={getFilter('XSX')}>
                            <path d="M16 5.425c-1.888-1.125-4.106-1.922-6.473-2.249l-0.092-0.010c-0.070-0.005-0.152-0.008-0.234-0.008-0.613 0-1.188 0.16-1.687 0.441l0.017-0.009c2.357-1.634 5.277-2.61 8.426-2.61 0.008 0 0.016 0 0.024 0h0.019c0.005 0 0.011 0 0.018 0 3.157 0 6.086 0.976 8.501 2.642l-0.050-0.033c-0.478-0.272-1.051-0.433-1.662-0.433-0.085 0-0.169 0.003-0.252 0.009l0.011-0.001c-2.459 0.336-4.677 1.13-6.648 2.297l0.082-0.045zM5.554 5.268c-0.041 0.014-0.077 0.032-0.11 0.054l0.002-0.001c-2.758 2.723-4.466 6.504-4.466 10.684 0 3.584 1.256 6.875 3.353 9.457l-0.022-0.028c-1.754-3.261 4.48-12.455 7.61-16.159-3.53-3.521-5.277-4.062-6.015-4.062-0.010-0-0.021-0.001-0.032-0.001-0.115 0-0.225 0.021-0.326 0.060l0.006-0.002zM20.083 9.275c3.129 3.706 9.367 12.908 7.605 16.161 2.075-2.554 3.332-5.845 3.332-9.43 0-4.181-1.709-7.962-4.467-10.684l-0.002-0.002c-0.029-0.021-0.063-0.039-0.1-0.052l-0.003-0.001c-0.1-0.036-0.216-0.056-0.336-0.056-0.005 0-0.011 0-0.016 0h0.001c-0.741-0-2.485 0.543-6.014 4.063zM6.114 27.306c2.627 2.306 6.093 3.714 9.888 3.714s7.261-1.407 9.905-3.728l-0.017 0.015c2.349-2.393-5.402-10.901-9.89-14.29-4.483 3.39-12.24 11.897-9.886 14.29z" />
                        </g>
                        <text x="0" y="35" textAnchor="middle" fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF">XBOX</text>
                    </g>

                    {/* 4. SWITCH */}
                    <g transform="translate(500, 0)" onClick={() => handlePlatformToggle('NSW')} style={{ cursor: 'pointer', opacity: getOpacity('NSW') }}>
                        <path d="M -35,-90 L 35,-90 L 25,0 L -25,0 Z" fill="url(#review-beamGradient)"/>
                        <rect x="-20" y="-1" width="40" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)" />

                        <g transform="translate(-24, -80) scale(1.5)" fill="#FFFFFF" mask="url(#review-holoMask)" filter={getFilter('NSW')}>
                            <path d="M18.901 32h4.901c4.5 0 8.198-3.698 8.198-8.198v-15.604c0-4.5-3.698-8.198-8.198-8.198h-5c-0.099 0-0.203 0.099-0.203 0.198v31.604c0 0.099 0.099 0.198 0.302 0.198zM25 14.401c1.802 0 3.198 1.5 3.198 3.198 0 1.802-1.5 3.198-3.198 3.198-1.802 0-3.198-1.396-3.198-3.198-0.104-1.797 1.396-3.198 3.198-3.198zM15.198 0h-7c-4.5 0-8.198 3.698-8.198 8.198v15.604c0 4.5 3.698 8.198 8.198 8.198h7c0.099 0 0.203-0.099 0.203-0.198v-31.604c0-0.099-0.099-0.198-0.203-0.198zM12.901 29.401h-4.703c-3.099 0-5.599-2.5-5.599-5.599v-15.604c0-3.099 2.5-5.599 5.599-5.599h4.604zM5 9.599c0 1.698 1.302 3 3 3s3-1.302 3-3c0-1.698-1.302-3-3-3s-3 1.302-3 3z"/>
                        </g>
                        <text x="0" y="35" textAnchor="middle" fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="16" fill="#FFFFFF">SWITCH</text>
                    </g>
                </g>
            </g>
        </g>
    );
}