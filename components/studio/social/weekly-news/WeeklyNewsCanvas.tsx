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

    // Calculate vibrance value
    const vibranceValue = (data.vibrance ?? 100) / 100;

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
                style={{ 
                    backgroundColor: '#050505', 
                    direction: 'rtl',
                    // Apply Saturation Filter to the entire SVG
                    filter: `saturate(${vibranceValue})` 
                }}
            >
                <WeeklyNewsDefs />

                {/* BACKGROUND LAYER */}
                <SpaceBackground />
                <rect width="100%" height="100%" fill="url(#wn-dataStream)" opacity="0.10" style={{ mixBlendMode: 'overlay' }}></rect>
                
                {/* LOGO (TOP CENTER) */}
                 <g transform="translate(530, 11) scale(0.053)">
                    <path fill="#0dffff" d="M579 0 502 248 446 315 460 388 366 690 483 815 550 734 456 738 541 715 572 678 601 595 586 688 607 658 653 521 629 451 617 540 598 374 642 441 630 111zM237 196 300 413 195 633 186 551 150 619 146 690 133 659 0 911 274 732 260 665 293 719 323 697 314 593 338 660 423 413zM317 739 150 841 185 886 125 856 71 889 200 1052 169 1052 253 1156 254 1079 490 1276 523 1390 529 1295 484 1107 357 1034 328 978 277 978 312 964 369 846 317 868 281 912 290 870 261 870 221 898 278 833zM353 727 335 782 428 860 457 910 457 838zM576 762 490 842 479 919zM610 793 475 965 514 1035 524 1004 606 924zM744 564 744 734 629 826 629 934 682 962 679 972 714 1026 658 987 636 955 598 961 536 1026 602 987 628 985 646 1007 491 1617 728 1150 732 1205 841 1030 775 1062 892 841z" filter="url(#wn-neonGlow)"/>
                </g>

                <g transform="translate(40, 60)">
                    {/* REMOVED BLACK BACKGROUND RECT HERE */}
                    <rect x="0" y="49" width="1000" height="1" fill="#00FFF0"></rect>
                    <rect x="994" y="-5" width="6" height="50" fill="#00FFF0"></rect>
                    
                    {/* Unified Title Bar with Space */}
                    <text x="980" y="32" direction="rtl" textAnchor="start" fontWeight="900" fontSize="34" fill="#FFFFFF" fontFamily="'Dystopian', 'Cairo', sans-serif">
                        الجريدة <tspan fill="#00FFF0">الأسبوعية</tspan>
                    </text>

                    <g transform="translate(0, 5)">
                        <path d="M 0,0 L 140,0 L 140,20 L 120,40 L 0,40 Z" fill="#00FFF0"></path>
                        
                        <EditableText
                            x={70} y={24}
                            text={data.weekNumber}
                            fontSize={22}
                            align="middle"
                            style={{ fill: "#000000", fontWeight: 900, fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                            onChange={(val) => onChange({ weekNumber: val })}
                            isEditing={editingField === 'weekNum'}
                            setEditing={(v) => setEditingField(v ? 'weekNum' : null)}
                            width={100}
                        />
                        
                        {/* FIXED: Year Position - Aligned Left inside the cyan box */}
                        <EditableText
                            x={15} y={34}
                            text={data.year}
                            fontSize={12}
                            align="end" // 'end' in RTL aligns to the LEFT edge
                            style={{ fill: "#000000", fontWeight: 'bold', fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                            onChange={(val) => onChange({ year: val })}
                            isEditing={editingField === 'year'}
                            setEditing={(v) => setEditingField(v ? 'year' : null)}
                            width={50}
                            inputStyle={{ fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                        />
                    </g>
                </g>

                <WeeklyNewsHero data={data} onChange={onChange} scale={scale} />
                <WeeklyNewsMainCards data={data} onChange={onChange} scale={scale} />
                <WeeklyNewsList data={data} onChange={onChange} />
                
                {/* CREDIT LINE (BOTTOM) */}
                <g transform="translate(540, 1330)">
                    <text x="0" y="-25" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#00FFF0" fontFamily="'Dystopian', 'Cairo', sans-serif" letterSpacing="1">تصميم 1EternalGames // @MoVisionX@</text>
                </g>

                <rect width="100%" height="100%" filter="url(#wn-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}