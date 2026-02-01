// components/studio/social/monthly-games/MonthlyGamesCanvas.tsx
'use client';

import React, { useState } from 'react';
import { MonthlyGamesCanvasProps } from './types';
import MonthlyGamesDefs from './MonthlyGamesDefs';
import GameSlot from './GameSlot';
import SpaceBackground from '../shared/SpaceBackground';
import EditableText from '../shared/EditableText';

const CARD_SCALE = 0.85;

const LOGO_PATH = "M579 0 502 248 446 315 460 388 366 690 483 815 550 734 456 738 541 715 572 678 601 595 586 688 607 658 653 521 629 451 617 540 598 374 642 441 630 111zM237 196 300 413 195 633 186 551 150 619 146 690 133 659 0 911 274 732 260 665 293 719 323 697 314 593 338 660 423 413zM317 739 150 841 185 886 125 856 71 889 200 1052 169 1052 253 1156 254 1079 490 1276 523 1390 529 1295 484 1107 357 1034 328 978 277 978 312 964 369 846 317 868 281 912 290 870 261 870 221 898 278 833zM353 727 335 782 428 860 457 910 457 838zM576 762 490 842 479 919zM610 793 475 965 514 1035 524 1004 606 924zM744 564 744 734 629 826 629 934 682 962 679 972 714 1026 658 987 636 955 598 961 536 1026 602 987 628 985 646 1007 491 1617 728 1150 732 1205 841 1030 775 1062 892 841z";

export default function MonthlyGamesCanvas({ data, onDataChange, scale = 1 }: MonthlyGamesCanvasProps) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleSlotChange = (index: number, newSlotData: Partial<typeof data.slots[0]>) => {
        const newSlots = [...data.slots];
        newSlots[index] = { ...newSlots[index], ...newSlotData };
        onDataChange({ slots: newSlots });
    };

    // Recalculated positions for smaller cards and a smaller header
    const X_POS = [79, 413, 746];
    const Y_POS = [250, 613, 976];

    // Default vibrance to 100 (1.0)
    const vibranceValue = (data.vibrance ?? 100) / 100;

    return (
        <div 
            className="canvas-container"
            id="monthly-games-canvas"
            style={{ 
                width: `${1080 * scale}px`, 
                height: `${1350 * scale}px`,
                transformOrigin: 'top left',
                position: 'relative',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }}
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
                <MonthlyGamesDefs />
                
                {/* SHARED BACKGROUND - Scanlines removed inside component */}
                <SpaceBackground />
                {/* REMOVED GRID OVERLAY */}
                {/* <rect width="100%" height="100%" fill="url(#mg-techGrid)"></rect> */}

                {/* SIMPLIFIED HEADER DESIGN */}
                <g transform="translate(540, 150) scale(0.8)">
                    <defs>
                        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="40%" stopColor="#00FFF0" />
                            <stop offset="100%" stopColor="#008F86" />
                        </linearGradient>

                        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                            <feColorMatrix in="blur" type="matrix" values="
                                0 0 0 0 0
                                0 0 0 0 1
                                0 0 0 0 0.94
                                0 0 0 1 0" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
    
                    {/* BACKGROUND LOGO STROKE */}
                    <g transform="translate(-80, -170) scale(0.17)">
                        <path 
                            d={LOGO_PATH} 
                            fill="none" 
                            stroke="#00FFF0" 
                            strokeWidth="12" 
                            opacity="0.5" 
                        />
                    </g>

                    {/* TEXT GROUP */}
                    <EditableText
                        x={0} y={-70}
                        text="أهم ألعاب"
                        fontSize={35}
                        align="middle"
                        onChange={() => {}}
                        isEditing={false}
                        setEditing={() => {}}
                        style={{ fill: "#FFFFFF", letterSpacing: '2px', filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))", fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                        width={400}
                    />
                    
                    <EditableText
                        x={0} y={25}
                        text={data.month}
                        fontSize={90}
                        align="middle"
                        onChange={(val) => onDataChange({ month: val })}
                        isEditing={editingField === 'month'}
                        setEditing={(val) => setEditingField(val ? 'month' : null)}
                        style={{ fill: "url(#titleGradient)", textTransform: 'uppercase', filter: "url(#neonGlow)", fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                        width={600}
                    />
    
                    {/* Bottom Structure */}
                    <g transform="translate(0, 60)">
                        <rect x="-80" y="13" width="160" height="4" fill="#00FFF0" filter="url(#neonGlow)" />
                    </g>
                </g>
                
                {/* --- SLOTS --- */}
                <GameSlot slot={data.slots[0]} onChange={(d) => handleSlotChange(0, d)} x={X_POS[0]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[1]} onChange={(d) => handleSlotChange(1, d)} x={X_POS[1]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[2]} onChange={(d) => handleSlotChange(2, d)} x={X_POS[2]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />
                
                <GameSlot slot={data.slots[3]} onChange={(d) => handleSlotChange(3, d)} x={X_POS[0]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[4]} onChange={(d) => handleSlotChange(4, d)} x={X_POS[1]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[5]} onChange={(d) => handleSlotChange(5, d)} x={X_POS[2]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />
                
                <GameSlot slot={data.slots[6]} onChange={(d) => handleSlotChange(6, d)} x={X_POS[0]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[7]} onChange={(d) => handleSlotChange(7, d)} x={X_POS[1]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[8]} onChange={(d) => handleSlotChange(8, d)} x={X_POS[2]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />


                {/* WATERMARK */}
                <g transform="translate(540, 1345)">
                    <text x="0" y="-12" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#00FFF0" fontFamily="'Dystopian', 'Cairo', sans-serif">1EternalGames // @MovisionX@</text>
                </g>

                <rect width="100%" height="100%" filter="url(#mg-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}