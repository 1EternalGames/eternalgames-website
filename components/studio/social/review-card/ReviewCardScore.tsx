// components/studio/social/review-card/ReviewCardScore.tsx
'use client';

import React, { useMemo } from 'react';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import { ReviewTemplateData } from './types';
import { stripHtml } from '../shared/canvas-utils';

interface ReviewCardScoreProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardScore({ data, onDataChange, editingField, setEditingField }: ReviewCardScoreProps) {
    // --- CONFIGURATION ---
    
    // 1. POSITION ON CANVAS
    const SCORE_GROUP_Y_POSITION = 95;
    
    // 2. PLANET (Center Shape) DIMENSIONS - COMPACT
    const PLANET_WIDTH_MULTIPLIER = 1.1; 
    const PLANET_HEIGHT_MULTIPLIER = 1.6;
    
    // 3. ORBIT (Star Ring) DIMENSIONS
    const ORBIT_WIDTH_MULTIPLIER = 1.0;
    const ORBIT_HEIGHT_MULTIPLIER = 1.0;

    // 4. FONT SIZE
    const FONT_SIZE_MULTIPLIER = 1.6;

    // ------------------------------------------------

    const scoreNum = parseFloat(stripHtml(data.score)) || 0;
    
    // Base Values
    const BASE_RX = 220;
    const BASE_RY = 60;
    const BASE_FONT_SIZE = 60;

    // Calculated Dimensions
    const rx = BASE_RX * ORBIT_WIDTH_MULTIPLIER;
    const ry = BASE_RY * ORBIT_HEIGHT_MULTIPLIER;
    
    const fontSize = BASE_FONT_SIZE * FONT_SIZE_MULTIPLIER;

    // Text Box Layout
    const boxWidth = 180 * PLANET_WIDTH_MULTIPLIER;
    const boxHeight = 90 * PLANET_HEIGHT_MULTIPLIER;
    const boxX = -boxWidth / 2;
    const boxY = -boxHeight / 2;

    // Orbital Configuration
    const starCount = Math.floor(scoreNum * 2);
    
    const stars = useMemo(() => {
        const generatedStars = [];
        for (let i = 0; i < starCount; i++) {
            const angle = (i / starCount) * Math.PI * 2;
            const x = Math.cos(angle) * rx;
            const y = Math.sin(angle) * ry;
            generatedStars.push({ x, y });
        }
        return generatedStars;
    }, [starCount, rx, ry]);

    const starsBack = stars.filter(s => s.y < 0);
    const starsFront = stars.filter(s => s.y >= 0);

    // --- NEW DESIGN: Minimalist HUD Frame (Sharpened) ---
    const frameSize = 65 * PLANET_WIDTH_MULTIPLIER; 
    const chamfer = 12; // Tighter, sharper cut 

    // Leg lengths
    const bigLeg = 22;   

    // 1. Neon Accents (Top-Left & Bottom-Right Only) - Standard Brackets
    const accentTL = `M ${-frameSize},${-frameSize + chamfer + bigLeg} L ${-frameSize},${-frameSize + chamfer} L ${-frameSize + chamfer},${-frameSize} L ${-frameSize + chamfer + bigLeg},${-frameSize}`;
    const accentBR = `M ${frameSize},${frameSize - chamfer - bigLeg} L ${frameSize},${frameSize - chamfer} L ${frameSize - chamfer},${frameSize} L ${frameSize - chamfer - bigLeg},${frameSize}`;
    
    const fontStack = data.font === 'cairo' ? "'Cairo', sans-serif" : "'Dystopian', 'Cairo', sans-serif";

    return (
        // Position: Centered in the right column (approx x=810)
        <g transform={`translate(810, ${SCORE_GROUP_Y_POSITION})`}>
            <defs>
                <filter id="orbital-starGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur"></feGaussianBlur>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
                <filter id="orbital-neonBloom" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"></feGaussianBlur>
                    <feMerge>
                        <feMergeNode in="coloredBlur"></feMergeNode>
                        <feMergeNode in="SourceGraphic"></feMergeNode>
                    </feMerge>
                </filter>
            </defs>

            {/* Static Rings */}
            <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="none" stroke="#556070" strokeWidth="1" opacity="0.2" />
            <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="none" stroke="#00FFF0" strokeWidth="1" strokeDasharray="10 60" opacity="0.4" />

            {/* Layer Back (Behind Planet) */}
            {starsBack.map((s, i) => (
                <circle 
                    key={`back-${i}`} 
                    cx={s.x} cy={s.y} 
                    r="1.5" 
                    fill="#FFF" stroke="#00FFF0" strokeWidth="1" 
                    filter="url(#orbital-starGlow)" 
                    opacity="0.6" 
                />
            ))}

            {/* The Main Score Container - FRAME REMOVED */}
            <g>
                {/* 1. Neon Corner Accents (Big - TL/BR Only) */}
                {/* strokeLinejoin="miter" creates sharp corners */}
                <path 
                    d={accentTL} 
                    fill="none" 
                    stroke="#00FFF0" 
                    strokeWidth="3" 
                    strokeLinecap="square"
                    strokeLinejoin="miter" 
                    filter="url(#orbital-neonBloom)" 
                />
                <path 
                    d={accentBR} 
                    fill="none" 
                    stroke="#00FFF0" 
                    strokeWidth="3" 
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    filter="url(#orbital-neonBloom)" 
                />

                {/* Editable Score Text */}
                <foreignObject x={boxX} y={boxY} width={boxWidth} height={boxHeight}>
                    <SocialNewsBodyEditor 
                        content={data.score} 
                        onChange={(val) => onDataChange({ score: val })}
                        isEditing={editingField === 'score'}
                        setEditing={(val) => setEditingField(val ? 'score' : null)}
                        fontSize={fontSize} 
                        textAlign="center"
                        customStyle={{ 
                            fill: "#00FFF0", 
                            color: "#00FFF0", 
                            fontFamily: "'Dystopian', 'Cairo', sans-serif",
                            fontWeight: 500,
                            lineHeight: 1.4,
                            textShadow: "0 0 20px rgba(0,255,240,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%"
                        }}
                        disableAutoEnglish={true}
                    />
                </foreignObject>
            </g>

            {/* Layer Front (In Front of Planet) */}
            {starsFront.map((s, i) => (
                <circle 
                    key={`front-${i}`} 
                    cx={s.x} cy={s.y} 
                    r="2.5" 
                    fill="#FFF" stroke="#00FFF0" strokeWidth="1" 
                    filter="url(#orbital-starGlow)" 
                    opacity="1" 
                />
            ))}
        </g>
    );
}