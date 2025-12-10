// components/studio/social/weekly-news/WeeklyNewsHero.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WeeklyNewsTemplateData } from './types';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import EditableText from '../shared/EditableText';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
    scale: number;
}

export default function WeeklyNewsHero({ data, onChange, scale }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    const [editingField, setEditingField] = useState<string | null>(null);
    
    // Image Dimensions
    const [imgDims, setImgDims] = useState({ width: 1080, height: 350 });
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        const img = new Image();
        img.src = data.hero.image;
        img.onload = () => {
            const w = img.naturalWidth || 1080;
            const h = img.naturalHeight || 350;
            setImgDims({ width: w, height: h });
            const scaleW = 1080 / w;
            const scaleH = 350 / h;
            setBaseScale(Math.max(scaleW, scaleH));
        };
    }, [data.hero.image]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onChange({ 
                        hero: { 
                            ...data.hero, 
                            image: ev.target.result as string,
                            imageSettings: { x: 0, y: 0, scale: 1 } 
                        } 
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        initialImgPos.current = { ...data.hero.imageSettings };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        onChange({ 
            hero: {
                ...data.hero,
                imageSettings: { 
                    ...data.hero.imageSettings, 
                    x: initialImgPos.current.x + dx, 
                    y: initialImgPos.current.y + dy 
                }
            }
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const settings = data.hero.imageSettings;
        const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001));
        onChange({ 
            hero: {
                ...data.hero,
                imageSettings: { ...settings, scale: newScale }
            }
        });
    };

    const settings = data.hero.imageSettings;
    const totalScale = baseScale * settings.scale;
    const transform = `translate(${540 + settings.x} ${175 + settings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    return (
        <g transform="translate(0, 110)">
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>

            <g clipPath="url(#wn-heroClipNotched)">
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
                        href={data.hero.image} 
                        width={imgDims.width}
                        height={imgDims.height}
                        transform={transform}
                        preserveAspectRatio="none"
                    />
                </g>
                <rect width="1080" height="350" fill="url(#wn-heroShadow)" pointerEvents="none"></rect>
            </g>

            <path d="M 0,0 L 1080,0 L 1080,100 L 1065,110 L 1065,150 L 1080,160 L 1080,260 L 1040,300 L 700,300 L 680,320 L 400,320 L 380,300 L 40,300 L 0,260 L 0,160 L 15,150 L 15,110 L 0,100 Z" fill="none" stroke="#556070" strokeWidth="2" pointerEvents="none"></path>
            <path d="M 1080,260 L 1040,300 L 700,300 L 680,320 L 400,320 L 380,300 L 40,300 L 0,260" fill="none" stroke="#00FFF0" strokeWidth="4" strokeLinecap="square" filter="url(#wn-neonGlow)" pointerEvents="none"></path>
            
            <rect x="1070" y="115" width="2" height="30" fill="#00FFF0" opacity="0.6"></rect>
            <rect x="8" y="115" width="2" height="30" fill="#00FFF0" opacity="0.6"></rect>

            <g transform="translate(1040, 220)">
                <g transform="translate(0, -90)">
                   <rect x="-160" y="0" width="160" height="30" fill="#00FFF0" transform="skewX(-20)"></rect>
                    <EditableText
                        x={-80} y={21}
                        text={data.hero.tag}
                        fontSize={16}
                        align="middle"
                        style={{ fill: "#000", fontWeight: 900 }}
                        onChange={(val) => onChange({ hero: { ...data.hero, tag: val }})}
                        isEditing={editingField === 'heroTag'}
                        setEditing={(v) => setEditingField(v ? 'heroTag' : null)}
                        width={140}
                    />
                </g>
                
                {/* ADJUSTED: Increased width to 900 and shifted X to -900 to give more space before wrapping */}
                <foreignObject x={-900} y={-45} width={900} height={90}>
                    <SocialNewsBodyEditor 
                        content={data.hero.title} 
                        onChange={(val) => onChange({ hero: { ...data.hero, title: val }})}
                        fontSize={44}
                        textAlign="right"
                        isEditing={editingField === 'heroTitle'}
                        setEditing={(v) => setEditingField(v ? 'heroTitle' : null)}
                        customStyle={{
                            color: "#FFFFFF",
                            fontWeight: 900,
                            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                            lineHeight: 1.1
                        }}
                        autoHeight
                    />
                </foreignObject>

                <foreignObject x={-600} y={45} width={600} height={40}>
                    <SocialNewsBodyEditor 
                        content={data.hero.subtitle} 
                        onChange={(val) => onChange({ hero: { ...data.hero, subtitle: val }})}
                        fontSize={24}
                        textAlign="right"
                        isEditing={editingField === 'heroSubtitle'}
                        setEditing={(v) => setEditingField(v ? 'heroSubtitle' : null)}
                        customStyle={{
                            color: "#00FFF0",
                            fontWeight: 700,
                            textShadow: "0 2px 10px rgba(0,0,0,0.5)"
                        }}
                        autoHeight
                        disableAutoEnglish
                    />
                </foreignObject>
            </g>
        </g>
    );
}