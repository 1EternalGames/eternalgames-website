// components/studio/social/review-card/ReviewCardTitle.tsx
'use client';

import React from 'react';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import { ReviewTemplateData } from './types';

interface ReviewCardTitleProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardTitle({ data, onDataChange, editingField, setEditingField }: ReviewCardTitleProps) {
    
    // --- CONFIGURATION ---
    const ARABIC_X_OFFSET = -120; 
    const ARABIC_WIDTH = 600;
    // Calculate the position of the decoration relative to the text box end
    const DECORATION_X_POS = ARABIC_X_OFFSET + ARABIC_WIDTH + 10; 

    return (
        <g transform="translate(40, 1100)">
            
            {/* --- DECORATIVE ANCHORS --- */}
            
            {/* 1. Left Vertical Bracket (Anchors English Text) */}
            <g transform="translate(-25, 45)">
                {/* Main Bracket Path - Cleaner */}
                <path 
                    d="M 15,0 L 0,0 L 0,135 L 15,135" 
                    fill="none" 
                    stroke="#00FFF0" 
                    strokeWidth="4" 
                    filter="url(#review-cyanGlow)"
                    strokeLinecap="square"
                />

                {/* Top/Bottom Anchor Blocks */}
                <rect x="-5" y="-5" width="10" height="20" fill="#00FFF0" filter="url(#review-cyanGlow)" />
                <rect x="-5" y="120" width="10" height="20" fill="#00FFF0" filter="url(#review-cyanGlow)" />
                
                {/* Center Accent - Solid Cyan */}
                <rect x="-2" y="60" width="4" height="15" fill="#00FFF0" filter="url(#review-cyanGlow)" />
            </g>

            {/* 2. Right Horizontal Anchor (Linked to Arabic Title Position) */}
            <g transform={`translate(${DECORATION_X_POS}, 48)`}>
                 <defs>
                    <linearGradient id="arabic-underline-fade" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#00FFF0" stopOpacity="0" />
                    </linearGradient>
                 </defs>
                 
                 {/* Main Line */}
                 <rect x="-300" y="0" width="300" height="2" fill="url(#arabic-underline-fade)" />
                 
                 {/* Accent Line Below */}
                 <rect x="-200" y="8" width="200" height="1" fill="url(#arabic-underline-fade)" opacity="0.5" />
                 
                 {/* End Cap Graphic */}
                 <path d="M 0,-8 L 12,-8 L 12,12 L 0,12 L -8,2 Z" fill="#00FFF0" filter="url(#review-cyanGlow)" />
            </g>

            {/* Arabic Title (Small, Top) */}
            <foreignObject x={ARABIC_X_OFFSET} y={10} width={ARABIC_WIDTH} height={40}>
                <SocialNewsBodyEditor 
                    content={data.gameTitleAr} 
                    onChange={(val) => onDataChange({ gameTitleAr: val })}
                    isEditing={editingField === 'gameTitleAr'}
                    setEditing={(val) => setEditingField(val ? 'gameTitleAr' : null)}
                    fontSize={22} 
                    textAlign="right" 
                    customStyle={{ 
                        color: "#E2E8F0", 
                        lineHeight: 1.2,
                        textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                        fontWeight: 700,
                        direction: 'rtl',
                        fontFamily: "'Dystopian', 'Cairo', sans-serif"
                    }}
                    disableAutoEnglish={true}
                />
            </foreignObject>
            
            <g transform="translate(0, 45)">
                 {/* English Top */}
                 <foreignObject x={-10} y={-15} width={600} height={90}>
                     <SocialNewsBodyEditor 
                        content={data.gameTitleEnTop} 
                        onChange={(val) => onDataChange({ gameTitleEnTop: val })}
                        isEditing={editingField === 'gameTitleEnTop'}
                        setEditing={(val) => setEditingField(val ? 'gameTitleEnTop' : null)}
                        fontSize={80}
                        textAlign="left"
                        customStyle={{ 
                            color: "#FFFFFF", 
                            letterSpacing: "-1px", 
                            fontFamily: "'Dystopian', 'Cairo', sans-serif",
                            fontWeight: 900,
                            direction: 'ltr',
                            textShadow: "0 4px 20px rgba(0,0,0,0.8)"
                        }}
                        disableAutoEnglish={true}
                    />
                 </foreignObject>
                
                {/* English Bottom */}
                <foreignObject x={-10} y={45} width={600} height={120}>
                    <SocialNewsBodyEditor 
                        content={data.gameTitleEnBottom} 
                        onChange={(val) => onDataChange({ gameTitleEnBottom: val })}
                        isEditing={editingField === 'gameTitleEnBottom'}
                        setEditing={(val) => setEditingField(val ? 'gameTitleEnBottom' : null)}
                        fontSize={75}
                        textAlign="left"
                        customStyle={{ 
                            color: "#00FFF0", 
                            filter: "drop-shadow(0 0 15px rgba(0,255,240,0.7))",
                            fontFamily: "'Dystopian', 'Cairo', sans-serif",
                            fontWeight: 900,
                            direction: 'ltr'
                        }}
                        disableAutoEnglish={true}
                    />
                </foreignObject>
            </g>
        </g>
    );
}