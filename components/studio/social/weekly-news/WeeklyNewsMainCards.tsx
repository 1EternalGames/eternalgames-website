// components/studio/social/weekly-news/WeeklyNewsMainCards.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WeeklyNewsTemplateData, WeeklyCardData } from './types';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
    scale: number;
}

const SingleCard = ({ 
    card, 
    index, 
    onCardChange, 
    scale 
}: { 
    card: WeeklyCardData, 
    index: number, 
    onCardChange: (d: WeeklyCardData) => void, 
    scale: number 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    const [imgDims, setImgDims] = useState({ width: 320, height: 160 });
    const [baseScale, setBaseScale] = useState(1);
    const [editingField, setEditingField] = useState<string | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = card.image;
        img.onload = () => {
            const w = img.naturalWidth || 320;
            const h = img.naturalHeight || 160;
            setImgDims({ width: w, height: h });
            const scaleW = 320 / w;
            const scaleH = 160 / h;
            setBaseScale(Math.max(scaleW, scaleH));
        };
    }, [card.image]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialImgPos.current = { ...card.imageSettings };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        onCardChange({ 
            ...card, 
            imageSettings: { 
                ...card.imageSettings, 
                x: initialImgPos.current.x + dx, 
                y: initialImgPos.current.y + dy 
            } 
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const settings = card.imageSettings;
        const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001));
        onCardChange({ ...card, imageSettings: { ...settings, scale: newScale } });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onCardChange({ 
                        ...card, 
                        image: ev.target.result as string,
                        imageSettings: { x: 0, y: 0, scale: 1 }
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const settings = card.imageSettings;
    const totalScale = baseScale * settings.scale;
    const transform = `translate(${160 + settings.x} ${80 + settings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    // X positions: 0, 340, 680 (Spacing between 320px cards)
    const xPos = index * 340;

    return (
        <g transform={`translate(${xPos}, 0)`}>
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>
            
            <g clipPath="url(#wn-platformClipV2)">
                <g
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                     onWheel={handleWheel}
                     onDoubleClick={() => fileInputRef.current?.click()}
                     style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                     <image 
                        href={card.image} 
                        width={imgDims.width}
                        height={imgDims.height}
                        transform={transform}
                        preserveAspectRatio="none"
                    />
                </g>
                <rect width="320" height="160" fill="url(#wn-cardShadow)" pointerEvents="none"></rect>
            </g>

            <path d="M 20,0 L 300,0 L 320,20 L 320,140 L 300,160 L 190,160 L 180,150 L 140,150 L 130,160 L 20,160 L 0,140 L 0,20 Z" fill="none" stroke="#556070" strokeWidth="2" pointerEvents="none"></path>
            <path d="M 128,160 L 140,150 L 180,150 L 192,160" stroke="#00FFF0" strokeWidth="3" fill="none" filter="url(#wn-strongNeonGlow)"></path>
            
            {/* Unified Title Field */}
            <foreignObject x={10} y={80} width={300} height={70}>
                <SocialNewsBodyEditor 
                    content={card.title} 
                    onChange={(val) => onCardChange({ ...card, title: val })}
                    fontSize={18}
                    textAlign="right"
                    isEditing={editingField === 'title'}
                    setEditing={(v) => setEditingField(v ? 'title' : null)}
                    customStyle={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        textShadow: "0 2px 4px #000"
                    }}
                    stylingVariant="card" // Use card variant for 2nd line smaller styling
                    disableAutoEnglish // Rely on variant styling
                />
            </foreignObject>
        </g>
    );
}

export default function WeeklyNewsMainCards({ data, onChange, scale }: Props) {
    const handleCardChange = (index: number, newCard: WeeklyCardData) => {
        const newCards = [...data.cards];
        newCards[index] = newCard;
        onChange({ cards: newCards });
    };

    return (
        <g transform="translate(40, 460)">
            {data.cards.map((card, index) => (
                <SingleCard 
                    key={card.id} 
                    index={index} 
                    card={card} 
                    onCardChange={(d) => handleCardChange(index, d)} 
                    scale={scale}
                />
            ))}
        </g>
    );
}