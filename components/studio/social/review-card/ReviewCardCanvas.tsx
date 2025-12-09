// components/studio/social/review-card/ReviewCardCanvas.tsx
'use client';

import React, { useState } from 'react';
import { ReviewCardCanvasProps } from './types';
import ReviewCardDefs from './ReviewCardDefs';
import ReviewCardFrame from './ReviewCardFrame';
import ReviewCardImage from './ReviewCardImage';
import ReviewCardTitle from './ReviewCardTitle';
import ReviewCardScore from './ReviewCardScore';
import ReviewCardVerdict from './ReviewCardVerdict';
import ReviewCardProsCons from './ReviewCardProsCons';
import ReviewCardPlatforms from './ReviewCardPlatforms';

export default function ReviewCardCanvas({ data, onDataChange, scale = 1 }: ReviewCardCanvasProps) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
             const reader = new FileReader();
            reader.onload = (ev) => { if(ev.target?.result) onDataChange({ image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } }); };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };

    return (
        <div 
            className="canvas-container"
            id="review-card-canvas"
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
                style={{ backgroundColor: '#050505', direction: 'ltr' }}
            >
                <ReviewCardDefs />
                
                <ReviewCardFrame enChar={data.gameTitleEnBottom ? data.gameTitleEnBottom.charAt(0) : 'R'} />
                
                <ReviewCardImage 
                    data={data} 
                    onDataChange={onDataChange} 
                    scale={scale} 
                />

                <ReviewCardTitle 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />
                
                <ReviewCardScore 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardVerdict 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardProsCons 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

                <ReviewCardPlatforms 
                    data={data} 
                    onDataChange={onDataChange} 
                    editingField={editingField} 
                    setEditingField={setEditingField} 
                />

            </svg>
        </div>
    );
}