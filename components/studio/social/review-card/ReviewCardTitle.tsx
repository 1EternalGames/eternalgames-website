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
    return (
        <g transform="translate(20, 1150)">
            <path d="M 0,0 L 460,0 L 480,25 L 480,30 L 0,30 Z" fill="url(#review-titleHeaderGradient)"></path>
            <rect x="0" y="0" width="150" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
            <rect x="150" y="0" width="310" height="1" fill="#556070"></rect>
            
            {/* Arabic Title: Ends at x=470 */}
            <foreignObject x={470 - 450} y={0} width={450} height={35}>
                <SocialNewsBodyEditor 
                    content={data.gameTitleAr} 
                    onChange={(val) => onDataChange({ gameTitleAr: val })}
                    isEditing={editingField === 'gameTitleAr'}
                    setEditing={(val) => setEditingField(val ? 'gameTitleAr' : null)}
                    fontSize={16}
                    textAlign="right"
                    customStyle={{ color: "#E2E8F0", lineHeight: 2 }}
                    disableAutoEnglish={true}
                />
            </foreignObject>
            
            <g transform="translate(0, 30)">
                <path d="M 0,0 L 480,0 L 480,90 L 460,110 L 0,110 Z" fill="#050608" opacity="0.95"></path>
                <rect x="0" y="0" width="480" height="110" fill="url(#review-hexTech)" clipPath="url(#review-titleBodyClip)" opacity="0.2"></rect>
                <rect x="0" y="0" width="6" height="110" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>

                <g transform="translate(25, 45)">
                     {/* English Top */}
                     <foreignObject x={0} y={-25} width={450} height={60}>
                         <SocialNewsBodyEditor 
                            content={data.gameTitleEnTop} 
                            onChange={(val) => onDataChange({ gameTitleEnTop: val })}
                            isEditing={editingField === 'gameTitleEnTop'}
                            setEditing={(val) => setEditingField(val ? 'gameTitleEnTop' : null)}
                            fontSize={44}
                            textAlign="left"
                            customStyle={{ 
                                color: "#FFFFFF", 
                                letterSpacing: "-1px", 
                                fontFamily: "Arial, sans-serif",
                                fontWeight: 900,
                                direction: 'ltr'
                            }}
                            disableAutoEnglish={true}
                        />
                     </foreignObject>
                    
                    {/* English Bottom */}
                    <foreignObject x={0} y={25} width={450} height={60}>
                        <SocialNewsBodyEditor 
                            content={data.gameTitleEnBottom} 
                            onChange={(val) => onDataChange({ gameTitleEnBottom: val })}
                            isEditing={editingField === 'gameTitleEnBottom'}
                            setEditing={(val) => setEditingField(val ? 'gameTitleEnBottom' : null)}
                            fontSize={48}
                            textAlign="left"
                            customStyle={{ 
                                color: "#00FFF0", 
                                filter: "drop-shadow(0 0 8px rgba(0,255,240,0.5))",
                                fontFamily: "Impact, sans-serif",
                                fontWeight: 400,
                                direction: 'ltr'
                            }}
                            disableAutoEnglish={true}
                        />
                    </foreignObject>
                </g>
            </g>
        </g>
    );
}


