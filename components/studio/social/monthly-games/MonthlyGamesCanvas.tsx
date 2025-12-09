// components/studio/social/monthly-games/MonthlyGamesCanvas.tsx
'use client';

import React, { useState } from 'react';
import { MonthlyGamesCanvasProps } from './types';
import MonthlyGamesDefs from './MonthlyGamesDefs';
import GameSlot from './GameSlot';
import SpaceBackground from '../shared/SpaceBackground';
import EditableText from '../shared/EditableText';

const CARD_SCALE = 0.9;

export default function MonthlyGamesCanvas({ data, onDataChange, scale = 1 }: MonthlyGamesCanvasProps) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleSlotChange = (index: number, newSlotData: Partial<typeof data.slots[0]>) => {
        const newSlots = [...data.slots];
        newSlots[index] = { ...newSlots[index], ...newSlotData };
        onDataChange({ slots: newSlots });
    };

    // Calculate grid positions for 85% scale (255x323)
    // 4 gaps over 1080px width
    // Gaps = (1080 - (255*3)) / 4 = 78.75
    // X positions: 79, 413, 746
    const X_POS = [79, 413, 746];
    
    // Y positions
    // Header is ~150px high. Footer ~100px.
    // Start at 180. Gap ~50px.
    // Row 1: 180
    // Row 2: 180 + 323 + 50 = 553
    // Row 3: 553 + 323 + 50 = 926
    const Y_POS = [180, 553, 926];

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
                style={{ backgroundColor: '#050505', direction: 'rtl' }}
            >
                <MonthlyGamesDefs />
                
                {/* SHARED BACKGROUND */}
                <SpaceBackground />
                <rect width="100%" height="100%" fill="url(#mg-techGrid)"></rect>

                {/* NEW HEADER DESIGN */}
                <g transform="translate(540, 80)">
                    {/* Big Cyan Title - Lifted Up - Using EditableText for cleaner export */}
                    <EditableText
                        x={0} 
                        y={20} // Adjusted position to be centered properly
                        text={data.month}
                        fontSize={60} // REDUCED from 80
                        align="middle"
                        onChange={(val) => onDataChange({ month: val })}
                        isEditing={editingField === 'month'}
                        setEditing={(val) => setEditingField(val ? 'month' : null)}
                        style={{
                            fill: "#00FFF0",
                            fontWeight: 900,
                            fontFamily: "'Cairo', sans-serif", // Changed to Cairo
                            textTransform: "uppercase",
                            filter: "drop-shadow(0 0 30px rgba(0,255,240,0.6))",
                        }}
                        width={800}
                    />

                    {/* Styled Line: Gray with Cyan Center */}
                    <g transform="translate(0, 95)">
                        <line x1="-300" y1="0" x2="300" y2="0" stroke="#556070" strokeWidth="2" opacity="0.3"></line>
                        <rect x="-40" y="-2" width="80" height="4" fill="#00FFF0" filter="drop-shadow(0 0 5px #00FFF0)"></rect>
                    </g>
                </g>

                {/* SLOTS - 3 Rows Grid Layout - RESCALED */}
                {/* Row 1 */}
                <GameSlot slot={data.slots[0]} onChange={(d) => handleSlotChange(0, d)} x={X_POS[0]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[1]} onChange={(d) => handleSlotChange(1, d)} x={X_POS[1]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[2]} onChange={(d) => handleSlotChange(2, d)} x={X_POS[2]} y={Y_POS[0]} scale={scale} sizeScale={CARD_SCALE} />

                {/* Row 2 */}
                <GameSlot slot={data.slots[3]} onChange={(d) => handleSlotChange(3, d)} x={X_POS[0]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[4]} onChange={(d) => handleSlotChange(4, d)} x={X_POS[1]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[5]} onChange={(d) => handleSlotChange(5, d)} x={X_POS[2]} y={Y_POS[1]} scale={scale} sizeScale={CARD_SCALE} />

                {/* Row 3 */}
                <GameSlot slot={data.slots[6]} onChange={(d) => handleSlotChange(6, d)} x={X_POS[0]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[7]} onChange={(d) => handleSlotChange(7, d)} x={X_POS[1]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />
                <GameSlot slot={data.slots[8]} onChange={(d) => handleSlotChange(8, d)} x={X_POS[2]} y={Y_POS[2]} scale={scale} sizeScale={CARD_SCALE} />

                {/* WATERMARK */}
                <g transform="translate(540, 1345)">
                    <text x="0" y="0" textAnchor="middle" fontWeight="bold" fontSize="12" fill="#556070" fontFamily="'Cairo', sans-serif">إيترنال جيمز // قاعدة البيانات متصلة</text>
                </g>

                <rect width="100%" height="100%" filter="url(#mg-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}