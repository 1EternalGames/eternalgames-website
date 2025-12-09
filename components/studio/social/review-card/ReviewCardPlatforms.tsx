// components/studio/social/review-card/ReviewCardPlatforms.tsx
'use client';

import React from 'react';
import EditableText from '../shared/EditableText';
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

    return (
        <g transform="translate(580, 1250)">
            <path d="M 0,0 L 460,0 L 460,90 L 440,110 L 20,110 L 0,90 Z" fill="#0B0D12" stroke="#556070" strokeWidth="1"></path>
            <rect x="30" y="45" width="400" height="2" fill="#1A202C"></rect>
            
            <g transform="translate(430, -15)">
                    <path d="M 0,0 L -150,0 L -160,10 L 0,10 Z" fill="#151820" stroke="#556070" strokeWidth="0.5"></path>
                    <text x="-10" y="7" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="10" fill="#00FFF0">المنصات المدعومة</text>
            </g>

            {/* Platforms */}
            {[
                { key: 'PC', label: 'PC', x: 30 },
                { key: 'PS5', label: 'PS5', x: 130 },
                { key: 'XSX', label: 'XSX', x: 230 },
                { key: 'NSW', label: 'NSW', x: 330 }
            ].map((p) => {
                const active = data.platforms[p.key as keyof typeof data.platforms];
                const Icon = PLATFORM_ICONS[p.key];
                return (
                    <g key={p.key} transform={`translate(${p.x}, 25)`} onClick={() => handlePlatformToggle(p.key as keyof typeof data.platforms)} style={{ cursor: 'pointer' }}>
                        <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z" fill={active ? "url(#review-activeModule)" : "url(#review-inactiveModule)"} stroke={active ? "#00FFF0" : "#556070"} strokeWidth="1" strokeDasharray={active ? "0" : "2 3"}></path>
                        {active && <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z" fill="url(#review-hexTech)" clipPath="url(#review-moduleClip)"></path>}
                        <g transform="translate(24, 9)">
                            <Icon width={32} height={32} fill={active ? "#FFFFFF" : "#556070"} />
                        </g>
                    </g>
                )
            })}

            {/* Specs */}
            <g transform="translate(30, 95)">
                <rect x="-10" y="-8" width="420" height="20" fill="#151820" rx="2" stroke="#556070" strokeWidth="0.5"></rect>
                <g transform="translate(20, 5)">
                        <EditableText x={10} y={0} text={data.techSpecs.res} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techRes'} setEditing={(v) => setEditingField(v ? 'techRes' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, res: val } })} width={100} />
                </g>
                <g transform="translate(130, 5)">
                    <EditableText x={10} y={0} text={data.techSpecs.fps} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techFps'} setEditing={(v) => setEditingField(v ? 'techFps' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, fps: val } })} width={100} />
                </g>
                    <g transform="translate(260, 5)">
                    <EditableText x={10} y={0} text={data.techSpecs.hdr} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techHdr'} setEditing={(v) => setEditingField(v ? 'techHdr' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, hdr: val } })} width={100} />
                </g>
            </g>
        </g>
    );
}