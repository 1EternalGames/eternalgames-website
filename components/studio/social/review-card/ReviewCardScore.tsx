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
    // --- CONFIGURATION (Edit these numbers) ---
    
    // 1. POSITION ON CANVAS
    const SCORE_GROUP_Y_POSITION = 110;
    
    // 2. PLANET (Center Shape) DIMENSIONS
    const PLANET_WIDTH_MULTIPLIER = 1.7; 
    const PLANET_HEIGHT_MULTIPLIER = 1.7;
    
    // 3. ORBIT (Star Ring) DIMENSIONS
    const ORBIT_WIDTH_MULTIPLIER = 1.0;
    const ORBIT_HEIGHT_MULTIPLIER = 1.0;

    // 4. FONT SIZE
    const FONT_SIZE_MULTIPLIER = 1.7;

    // ------------------------------------------------

    const scoreNum = parseFloat(stripHtml(data.score)) || 0;
    
    // Base Values
    const BASE_RX = 220;
    const BASE_RY = 60;
    const BASE_PLANET_R = 55;
    const BASE_FONT_SIZE = 60;

    // Calculated Dimensions
    const rx = BASE_RX * ORBIT_WIDTH_MULTIPLIER;
    const ry = BASE_RY * ORBIT_HEIGHT_MULTIPLIER;
    
    const planetRx = BASE_PLANET_R * PLANET_WIDTH_MULTIPLIER;
    const planetRy = BASE_PLANET_R * PLANET_HEIGHT_MULTIPLIER;
    
    const fontSize = BASE_FONT_SIZE * FONT_SIZE_MULTIPLIER;

    // Text Box Layout
    const boxWidth = 120 * PLANET_WIDTH_MULTIPLIER;
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

    // --- Dynamic Paths for "Hex-Shield" ---
    // A vertical hexagon shape
    const hexW = planetRx * 0.9;
    const hexH = planetRy;
    
    // Points: Top, TopRight, BottomRight, Bottom, BottomLeft, TopLeft
    const p0 = `0,${-hexH}`;
    const p1 = `${hexW * 0.866},${-hexH * 0.5}`;
    const p2 = `${hexW * 0.866},${hexH * 0.5}`;
    const p3 = `0,${hexH}`;
    const p4 = `${-hexW * 0.866},${hexH * 0.5}`;
    const p5 = `${-hexW * 0.866},${-hexH * 0.5}`;
    
    // Full filled background
    const hexPath = `M ${p0} L ${p1} L ${p2} L ${p3} L ${p4} L ${p5} Z`;
    
    // Upper Segment Line (Top Left -> Top -> Top Right)
    const upperLinePath = `M ${-hexW * 0.866},${-hexH * 0.25} L ${p5} L ${p0} L ${p1} L ${hexW * 0.866},${-hexH * 0.25}`;
    
    // Lower Segment Line (Bottom Left -> Bottom -> Bottom Right)
    const lowerLinePath = `M ${-hexW * 0.866},${hexH * 0.25} L ${p4} L ${p3} L ${p2} L ${hexW * 0.866},${hexH * 0.25}`;

    return (
        // Position: Centered in the right column (approx x=810)
        <g transform={`translate(810, ${SCORE_GROUP_Y_POSITION})`}>
            <defs>
                <filter id="orbital-starGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur"></feGaussianBlur>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                </filter>
                <filter id="orbital-neonBloom" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
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

            {/* The Hex-Shield Container */}
            <g>
                {/* 1. Background Field (Hexagon) */}
                <path 
                    d={hexPath} 
                    fill="#000" 
                    fillOpacity="0.85"
                    stroke="none"
                />

                {/* 2. Top Tech Segment */}
                <path 
                    d={upperLinePath} 
                    fill="none" 
                    stroke="#00FFF0" 
                    strokeWidth="3" 
                    strokeLinecap="square"
                    strokeLinejoin="round"
                    filter="url(#orbital-neonBloom)" 
                />
                
                {/* 3. Bottom Tech Segment */}
                <path 
                    d={lowerLinePath} 
                    fill="none" 
                    stroke="#00FFF0" 
                    strokeWidth="3" 
                    strokeLinecap="square"
                    strokeLinejoin="round"
                    filter="url(#orbital-neonBloom)" 
                />

                {/* 4. Decorative Side Nodes (Vertical Bars) */}
                <rect x={-hexW - 2} y={-15} width="4" height="30" fill="#00FFF0" opacity="0.8" />
                <rect x={hexW - 2} y={-15} width="4" height="30" fill="#00FFF0" opacity="0.8" />

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
                            fontFamily: "Impact, sans-serif",
                            fontWeight: 400,
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