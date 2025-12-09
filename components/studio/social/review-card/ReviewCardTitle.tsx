// components/studio/social/review-card/ReviewCardTitle.tsx
'use client';

import React from 'react';
import EditableText from '../shared/EditableText';
import { ReviewTemplateData } from './types';

interface ReviewCardTitleProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardTitle({ data, onDataChange, editingField, setEditingField }: ReviewCardTitleProps) {
    return (
        <g transform="translate(20, 1150)">
            <path d="M 0,0 L 460,0 L 480,25 L 480,30 L 0,30 Z" fill="url(#review-titleHeaderGradient)"></path>
            <rect x="0" y="0" width="150" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
            <rect x="150" y="0" width="310" height="1" fill="#556070"></rect>
            
            <EditableText 
                x={470} y={20} 
                text={data.gameTitleAr} 
                fontSize={16} 
                align="end" 
                style={{ fill: "#E2E8F0" }}
                isEditing={editingField === 'gameTitleAr'}
                setEditing={(v) => setEditingField(v ? 'gameTitleAr' : null)}
                onChange={(val) => onDataChange({ gameTitleAr: val })}
                width={450}
            />
            
            <g transform="translate(0, 30)">
                <path d="M 0,0 L 480,0 L 480,90 L 460,110 L 0,110 Z" fill="#050608" opacity="0.95"></path>
                <rect x="0" y="0" width="480" height="110" fill="url(#review-hexTech)" clipPath="url(#review-titleBodyClip)" opacity="0.2"></rect>
                <rect x="0" y="0" width="6" height="110" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>

                <g transform="translate(25, 45)">
                        <EditableText 
                        x={0} y={0} 
                        text={data.gameTitleEnTop} 
                        fontSize={44} 
                        align="start" 
                        style={{ fill: "#FFFFFF", letterSpacing: "-1px" }}
                        fontFamily="Arial, sans-serif"
                        fontWeight={900}
                        isEditing={editingField === 'gameTitleEnTop'}
                        setEditing={(v) => setEditingField(v ? 'gameTitleEnTop' : null)}
                        onChange={(val) => onDataChange({ gameTitleEnTop: val })}
                        width={450}
                    />
                    
                    <EditableText 
                        x={0} y={45} 
                        text={data.gameTitleEnBottom} 
                        fontSize={48} 
                        align="start" 
                        style={{ fill: "#00FFF0", filter: "drop-shadow(0 0 8px rgba(0,255,240,0.5))" }}
                        fontFamily="Impact, sans-serif"
                        fontWeight={400}
                        isEditing={editingField === 'gameTitleEnBottom'}
                        setEditing={(v) => setEditingField(v ? 'gameTitleEnBottom' : null)}
                        onChange={(val) => onDataChange({ gameTitleEnBottom: val })}
                        width={450}
                    />
                </g>
            </g>
        </g>
    );
}