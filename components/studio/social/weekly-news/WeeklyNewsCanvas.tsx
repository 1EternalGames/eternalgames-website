// components/studio/social/weekly-news/WeeklyNewsCanvas.tsx
'use client';

import React, { useState } from 'react';
import { WeeklyNewsTemplateData } from './types';
import WeeklyNewsDefs from './WeeklyNewsDefs';
import WeeklyNewsHero from './WeeklyNewsHero';
import WeeklyNewsMainCards from './WeeklyNewsMainCards';
import WeeklyNewsList from './WeeklyNewsList';
import EditableText from '../shared/EditableText';
import SpaceBackground from '../shared/SpaceBackground';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
    scale?: number;
}

export default function WeeklyNewsCanvas({ data, onChange, scale = 1 }: Props) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
    };

    return (
        <div 
            className="canvas-container"
            id="weekly-news-canvas"
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
                style={{ backgroundColor: '#050505', direction: 'rtl' }}
            >
                <WeeklyNewsDefs />

                {/* BACKGROUND LAYER */}
                <SpaceBackground />
                <rect width="100%" height="100%" fill="url(#wn-dataStream)" opacity="0.10" style={{ mixBlendMode: 'overlay' }}></rect>

                <g transform="translate(40, 60)">
                    {/* REMOVED BLACK BACKGROUND RECT HERE */}
                    <rect x="0" y="49" width="1000" height="1" fill="#00FFF0"></rect>
                    <rect x="994" y="-5" width="6" height="50" fill="#00FFF0"></rect>
                    
                    {/* Unified Title Bar with Space */}
                    <text x="980" y="32" direction="rtl" textAnchor="start" fontWeight="900" fontSize="34" fill="#FFFFFF">
                        الجريدة <tspan fill="#00FFF0">الأسبوعية</tspan>
                    </text>

                    <g transform="translate(0, 5)">
                        <path d="M 0,0 L 140,0 L 140,20 L 120,40 L 0,40 Z" fill="#00FFF0"></path>
                        
                        <EditableText
                            x={70} y={26}
                            text={data.weekNumber}
                            fontSize={22}
                            align="middle"
                            style={{ fill: "#000000", fontWeight: 900 }}
                            onChange={(val) => onChange({ weekNumber: val })}
                            isEditing={editingField === 'weekNum'}
                            setEditing={(v) => setEditingField(v ? 'weekNum' : null)}
                            width={100}
                        />
                        
                        {/* FIXED: Year Position - Aligned Left inside the cyan box */}
                        <EditableText
                            x={15} y={35}
                            text={data.year}
                            fontSize={12}
                            align="end" // 'end' in RTL aligns to the LEFT edge
                            style={{ fill: "#000000", fontWeight: 'bold', fontFamily: 'monospace' }}
                            onChange={(val) => onChange({ year: val })}
                            isEditing={editingField === 'year'}
                            setEditing={(v) => setEditingField(v ? 'year' : null)}
                            width={50}
                            inputStyle={{ fontFamily: 'monospace' }}
                        />
                    </g>
                </g>

                <WeeklyNewsHero data={data} onChange={onChange} scale={scale} />
                <WeeklyNewsMainCards data={data} onChange={onChange} scale={scale} />
                <WeeklyNewsList data={data} onChange={onChange} />

                <rect width="100%" height="100%" filter="url(#wn-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}


