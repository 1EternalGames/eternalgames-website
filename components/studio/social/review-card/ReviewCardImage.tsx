// components/studio/social/review-card/ReviewCardImage.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ReviewTemplateData } from './types';

interface ReviewCardImageProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    scale: number;
    editMode?: 'image' | 'gradient'; // Added prop
}

export default function ReviewCardImage({ data, onDataChange, scale, editMode = 'image' }: ReviewCardImageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 }); // Shared ref for starting pos
    const [imgDims, setImgDims] = useState({ width: 700, height: 1350 });
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        const img = new Image();
        img.src = data.image;
        img.onload = () => {
            const w = img.naturalWidth || 700;
            const h = img.naturalHeight || 1350;
            setImgDims({ width: w, height: h });
            const scaleW = 700 / w; 
            const scaleH = 1350 / h;
            setBaseScale(Math.max(scaleW, scaleH));
        };
    }, [data.image]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        
        if (editMode === 'gradient') {
             // Use gradient settings
             const gSettings = data.gradientSettings || { x: 0, y: 0 };
             initialPos.current = { x: gSettings.x, y: gSettings.y };
        } else {
             // Use image settings
             initialPos.current = { x: data.imageSettings.x, y: data.imageSettings.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        
        if (editMode === 'gradient') {
            const gSettings = data.gradientSettings || { active: true, x: 0, y: 0, opacity: 50, scale: 1.5 };
            onDataChange({ 
                gradientSettings: { 
                    ...gSettings, 
                    x: initialPos.current.x + dx, 
                    y: initialPos.current.y + dy 
                } 
            });
        } else {
            onDataChange({ 
                imageSettings: { 
                    ...data.imageSettings, 
                    x: initialPos.current.x + dx, 
                    y: initialPos.current.y + dy 
                } 
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY * 0.001;
        
        if (editMode === 'gradient') {
             const gSettings = data.gradientSettings || { active: true, x: 0, y: 0, opacity: 50, scale: 1.5 };
             const newScale = Math.max(0.1, Math.min(5, gSettings.scale - delta));
             onDataChange({ gradientSettings: { ...gSettings, scale: newScale }});
        } else {
             const settings = data.imageSettings;
             const newScale = Math.max(0.5, Math.min(5, settings.scale - delta));
             onDataChange({ imageSettings: { ...settings, scale: newScale } });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onDataChange({ image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const imgSettings = data.imageSettings;
    const totalScale = baseScale * imgSettings.scale;
    const imageTransform = `translate(${270 + imgSettings.x} ${675 + imgSettings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    // TINT LOGIC
    // Global Tint (Linear Wash)
    const tintOpacity = (data.tintStrength ?? 0) / 100;
    const atmosphereOpacity = tintOpacity; // 0 to 1

    // GRADIENT LOGIC (The "Spotlight")
    const gradSettings = data.gradientSettings || { x: 0, y: 0, opacity: 50, scale: 1.5 };
    const gradOpacity = gradSettings.opacity / 100;
    
    // We define a unique ID for the gradient to allow moving it
    const gradId = `spotlight-${data.id}`;
    
    // Center of the viewBox is 540, 675. 
    // We start the gradient there, then translate it by user's X/Y.
    const gradCx = 540 + gradSettings.x;
    const gradCy = 675 + gradSettings.y;
    // Scale is applied to the radius
    const gradRadius = 800 * gradSettings.scale; 

    return (
        <>
            <defs>
                <radialGradient id={gradId} gradientUnits="userSpaceOnUse" cx={gradCx} cy={gradCy} r={gradRadius}>
                    <stop offset="0%" stopColor="#00FFF0" stopOpacity={gradOpacity} />
                    <stop offset="100%" stopColor="#00FFF0" stopOpacity="0" />
                </radialGradient>
            </defs>
            
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>
            
            <g clipPath="url(#review-monolithClip)">
                    <g 
                        id="upload-zone" 
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onDoubleClick={() => fileInputRef.current?.click()}
                        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                    >
                        {/* 1. THE IMAGE ITSELF */}
                        <image 
                            href={data.image} 
                            width={imgDims.width}
                            height={imgDims.height}
                            preserveAspectRatio="none" 
                            style={{transition: (isDragging && editMode === 'image') ? 'none' : 'transform 0.2s ease'}}
                            transform={imageTransform} 
                        />
                        
                        {/* 2. ATMOSPHERE TINT (Global Wash) */}
                        <rect 
                            width="1080" height="1350" 
                            fill="#00FFF0" 
                            opacity={atmosphereOpacity} 
                            style={{ mixBlendMode: 'overlay', pointerEvents: 'none' }} 
                        />
                        
                        {/* 3. MOVABLE GRADIENT SPOTLIGHT (New Layer) */}
                        <rect 
                            width="1080" height="1350" 
                            fill={`url(#${gradId})`}
                            style={{ mixBlendMode: 'overlay', pointerEvents: 'none', transition: (isDragging && editMode === 'gradient') ? 'none' : 'all 0.1s ease' }} 
                        />
                    </g>
                    
                    {/* Shadow Overlay */}
                    <rect width="540" height="1350" fill="url(#review-monolithFade)" pointerEvents="none"></rect>
            </g>
        </>
    );
}