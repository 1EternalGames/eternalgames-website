// components/studio/social/monthly-games/MonthlyGamesCanvas.tsx
'use client';

import React, { useState } from 'react';
import { MonthlyGamesCanvasProps } from './types';
import MonthlyGamesDefs from './MonthlyGamesDefs';
import GameSlot from './GameSlot';
import SpaceBackground from '../shared/SpaceBackground';
import EditableText from '../shared/EditableText';

const CARD_SCALE = 0.85;

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
    
                    {/* TEXT GROUP */}
                    <EditableText
                        x={0} y={-70}
                        text="أهم ألعاب"
                        fontSize={35}
                        align="middle"
                        onChange={() => {}}
                        isEditing={false}
                        setEditing={() => {}}
                        style={{ fill: "#FFFFFF", letterSpacing: '2px', filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))" }}
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
                        style={{ fill: "url(#titleGradient)", textTransform: 'uppercase', filter: "url(#neonGlow)" }}
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
                    <text x="0" y="-12" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#556070" fontFamily="'Cairo', sans-serif">MoVisionX@</text>
                </g>

                <rect width="100%" height="100%" filter="url(#mg-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}