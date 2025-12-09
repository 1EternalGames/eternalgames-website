// components/studio/social/review-card/ReviewCardScore.tsx
'use client';

import React from 'react';
import EditableText from '../shared/EditableText';
import { ReviewTemplateData } from './types';

interface ReviewCardScoreProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardScore({ data, onDataChange, editingField, setEditingField }: ReviewCardScoreProps) {
    const scoreNum = parseFloat(data.score) || 0;
    const perimeter = 480; 
    const dashArray = `${(scoreNum / 10) * perimeter} ${perimeter}`;

    return (
        <g transform="translate(580, 40)">
            <path d="M 40,0 L 460,0 L 460,180 L 420,220 L 0,220 L 0,40 Z" fill="url(#review-glassGradient)" stroke="#00FFF0" strokeWidth="1" strokeOpacity="0.3"></path>
            <rect x="0" y="0" width="460" height="220" fill="url(#review-hexTech)" clipPath="url(#review-prismClip)"></rect>

            {/* SCORE CIRCLE */}
            <g transform="translate(350, 110)">
                <path d="M 0,-80 L 70,-40 L 70,40 L 0,80 L -70,40 L -70,-40 Z" fill="#0B0D12" stroke="#1A202C" strokeWidth="2"></path>
                <path d="M 0,-80 L 70,-40 L 70,40 L 0,80 L -70,40 L -70,-40 Z" fill="none" stroke="#00FFF0" strokeWidth="5" strokeDasharray={dashArray} strokeLinecap="round" filter="url(#review-cyanGlow)" transform="rotate(0)"></path>
                <path d="M 0,-60 L 52,-30 L 52,30 L 0,60 L -52,30 L -52,-30 Z" fill="none" stroke="#556070" strokeWidth="1" opacity="0.5"></path>

                <EditableText 
                    x={0} y={25} 
                    text={data.score} 
                    fontSize={70} 
                    align="middle" 
                    style={{ fill: "#FFFFFF", letterSpacing: "-2px" }}
                    fontFamily="Impact, sans-serif"
                    fontWeight={400}
                    width={100}
                    isEditing={editingField === 'score'}
                    setEditing={(v) => setEditingField(v ? 'score' : null)}
                    onChange={(val) => onDataChange({ score: val })}
                />
                <text x="0" y="55" textAnchor="middle" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="12" fill="#00FFF0">التقييم</text>
            </g>

            {/* Rank Info */}
            <g transform="translate(220, 30)">
                <path d="M 0,10 L 30,0 L 40,0" fill="none" stroke="#556070" strokeWidth="1" opacity="0.5"></path>
                <text x="30" y="30" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="14" fill="#556070">التصنيف</text>
                
                <EditableText 
                    x={30} y={80} 
                    text={data.rank} 
                    fontSize={45} 
                    align="end" 
                    style={{ fill: "#FFFFFF", fontStyle: "italic" }}
                    fontFamily="Arial, sans-serif"
                    fontWeight={900}
                    width={140}
                    isEditing={editingField === 'rank'}
                    setEditing={(v) => setEditingField(v ? 'rank' : null)}
                    onChange={(val) => onDataChange({ rank: val })}
                />
                
                <g transform="translate(30, 120)">
                    <rect x="0" y="0" width="2" height="40" fill="#556070"></rect>
                    <text x="-15" y="15" textAnchor="end" fontFamily="monospace" fontSize="12" fill="#556070">:الحالة</text>
                    <EditableText 
                        x={-15} y={35} 
                        text={data.status} 
                        fontSize={18} 
                        align="end" 
                        style={{ fill: "#00FFF0" }}
                        width={120}
                        isEditing={editingField === 'status'}
                        setEditing={(v) => setEditingField(v ? 'status' : null)}
                        onChange={(val) => onDataChange({ status: val })}
                    />
                </g>
            </g>
        </g>
    );
}