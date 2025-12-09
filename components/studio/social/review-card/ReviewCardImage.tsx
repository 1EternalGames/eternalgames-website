// components/studio/social/review-card/ReviewCardImage.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ReviewTemplateData } from './types';

interface ReviewCardImageProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    scale: number;
}

export default function ReviewCardImage({ data, onDataChange, scale }: ReviewCardImageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
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
        initialImgPos.current = { x: data.imageSettings.x, y: data.imageSettings.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        onDataChange({ imageSettings: { ...data.imageSettings, x: initialImgPos.current.x + dx, y: initialImgPos.current.y + dy } });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const settings = data.imageSettings;
        const newScale = Math.max(0.5, Math.min(5, settings.scale - e.deltaY * 0.001));
        onDataChange({ imageSettings: { ...settings, scale: newScale } });
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

    return (
        <>
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
                    transform={imageTransform} 
                    >
                    <image 
                        href={data.image} 
                        width={imgDims.width}
                        height={imgDims.height}
                        preserveAspectRatio="none" 
                        style={{transition: isDragging ? 'none' : 'transform 0.2s ease'}}
                    />
                    </g>
                    <rect width="540" height="1350" fill="url(#review-monolithFade)" pointerEvents="none"></rect>
            </g>
        </>
    );
}