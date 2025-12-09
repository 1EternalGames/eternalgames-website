// components/studio/social/monthly-games/MonthlyGamesCanvas.tsx
'use client';

import React, { useState } from 'react';
import { MonthlyGamesCanvasProps } from './types';
import MonthlyGamesDefs from './MonthlyGamesDefs';
import GameSlot from './GameSlot';
import SpaceBackground from '../shared/SpaceBackground';
import EditableText from '../shared/EditableText';

export default function MonthlyGamesCanvas({ data, onDataChange, scale = 1 }: MonthlyGamesCanvasProps) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleSlotChange = (index: number, newSlotData: Partial<typeof data.slots[0]>) => {
        const newSlots = [...data.slots];
        newSlots[index] = { ...newSlots[index], ...newSlotData };
        onDataChange({ slots: newSlots });
    };

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
                        fontSize={80}
                        align="middle"
                        onChange={(val) => onDataChange({ month: val })}
                        isEditing={editingField === 'month'}
                        setEditing={(val) => setEditingField(val ? 'month' : null)}
                        style={{
                            fill: "#00FFF0",
                            fontWeight: 900,
                            fontFamily: "Impact, sans-serif",
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

                {/* SLOTS - 3 Rows Grid Layout */}
                {/* Row 1 */}
                <GameSlot slot={data.slots[0]} onChange={(d) => handleSlotChange(0, d)} x={40} y={140} scale={scale} />
                <GameSlot slot={data.slots[1]} onChange={(d) => handleSlotChange(1, d)} x={390} y={140} scale={scale} />
                <GameSlot slot={data.slots[2]} onChange={(d) => handleSlotChange(2, d)} x={740} y={140} scale={scale} />

                {/* Row 2 */}
                <GameSlot slot={data.slots[3]} onChange={(d) => handleSlotChange(3, d)} x={40} y={550} scale={scale} />
                <GameSlot slot={data.slots[4]} onChange={(d) => handleSlotChange(4, d)} x={390} y={550} scale={scale} />
                <GameSlot slot={data.slots[5]} onChange={(d) => handleSlotChange(5, d)} x={740} y={550} scale={scale} />

                {/* Row 3 */}
                <GameSlot slot={data.slots[6]} onChange={(d) => handleSlotChange(6, d)} x={40} y={960} scale={scale} />
                <GameSlot slot={data.slots[7]} onChange={(d) => handleSlotChange(7, d)} x={390} y={960} scale={scale} />
                <GameSlot slot={data.slots[8]} onChange={(d) => handleSlotChange(8, d)} x={740} y={960} scale={scale} />

                {/* WATERMARK */}
                <g transform="translate(540, 1345)">
                    <text x="0" y="0" textAnchor="middle" fontWeight="bold" fontSize="12" fill="#556070" fontFamily="'Cairo', sans-serif">إيترنال جيمز // قاعدة البيانات متصلة</text>
                </g>

                <rect width="100%" height="100%" filter="url(#mg-grain)" opacity="0.06" style={{ mixBlendMode: 'overlay' }} pointerEvents="none"></rect>
            </svg>
        </div>
    );
}