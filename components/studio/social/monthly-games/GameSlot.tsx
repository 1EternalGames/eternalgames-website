// components/studio/social/monthly-games/GameSlot.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { GameSlotData } from './types';
import { PLATFORM_ICONS } from './utils';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import EditableText from '../shared/EditableText';

interface GameSlotProps {
    slot: GameSlotData;
    onChange: (newData: Partial<GameSlotData>) => void;
    x: number;
    y: number;
    scale: number; // for pointer calculations
}

export default function GameSlot({ slot, onChange, x, y, scale }: GameSlotProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    
    const [imgDims, setImgDims] = useState({ width: 300, height: 380 });
    const [baseScale, setBaseScale] = useState(1);
    
    useEffect(() => {
        const img = new Image();
        img.src = slot.image;
        img.onload = () => {
            const w = img.naturalWidth || 300;
            const h = img.naturalHeight || 380;
            setImgDims({ width: w, height: h });
            const scaleW = 300 / w;
            const scaleH = 380 / h;
            setBaseScale(Math.max(scaleW, scaleH));
        };
    }, [slot.image]);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onChange({ 
                        image: ev.target.result as string,
                        imageSettings: { x: 0, y: 0, scale: 1 } 
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
        initialImgPos.current = { x: slot.imageSettings.x, y: slot.imageSettings.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        onChange({ imageSettings: { ...slot.imageSettings, x: initialImgPos.current.x + dx, y: initialImgPos.current.y + dy } });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.stopPropagation(); setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const settings = slot.imageSettings;
        const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001));
        onChange({ imageSettings: { ...settings, scale: newScale } });
    };

    const handleDrop = (e: React.DragEvent<SVGGElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
             const reader = new FileReader();
            reader.onload = (ev) => { if(ev.target?.result) onChange({ image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } }); };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };
    
    const handlePlatformToggle = (e: React.MouseEvent, key: keyof typeof slot.platforms) => {
        e.stopPropagation(); 
        onChange({ platforms: { ...slot.platforms, [key]: !slot.platforms[key] } });
    };

    const imgSettings = slot.imageSettings || { x: 0, y: 0, scale: 1 };
    const totalScale = baseScale * imgSettings.scale;
    const imageTransform = `translate(${150 + imgSettings.x} ${190 + imgSettings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>
            
            <g 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onDoubleClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                clipPath="url(#mg-towerClip)"
            >
                 <image 
                    href={slot.image} 
                    width={imgDims.width}
                    height={imgDims.height}
                    transform={imageTransform}
                    preserveAspectRatio="none"
                    style={{ transition: isDragging ? 'none' : 'transform 0.2s ease' }}
                />
            </g>

            <rect width="300" height="380" fill="url(#mg-glassGradient)" clipPath="url(#mg-towerClip)" pointerEvents="none"></rect>
            
            <path d="M 40,0 L 300,0 L 300,120 L 290,125 L 300,130 L 300,250 L 290,260 L 290,290 L 300,300 L 300,350 L 270,380 L 30,380 L 0,350 L 0,300 L 10,290 L 10,260 L 0,250 L 0,130 L 10,125 L 0,120 L 0,40 L 40,0 Z" 
                  fill="none" stroke="#556070" strokeWidth="2" pointerEvents="none" />
            
            <path d="M 0,300 L 0,350 L 30,380" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 300,300 L 300,350 L 270,380" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 10,260 L 10,290" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 290,260 L 290,290" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />

            <g transform="translate(0,0)" onMouseDown={(e) => e.stopPropagation()}>
                <use href="#mg-cyberDateTag"></use>
                <EditableText
                    x={30} 
                    y={36} 
                    text={slot.day}
                    fontSize={30}
                    align="middle"
                    style={{ fill: "#050505" }}
                    fontFamily="Impact, sans-serif"
                    fontWeight={400}
                    onChange={(val) => onChange({ day: val })}
                    isEditing={editingField === 'day'}
                    setEditing={(val) => setEditingField(val ? 'day' : null)}
                    width={60}
                />
            </g>
            
            <g transform="translate(160, 0)">
                {slot.badges.gamePass && (
                    <g onClick={() => onChange({ badges: { ...slot.badges, gamePass: !slot.badges.gamePass } })} style={{ cursor: 'pointer' }}>
                        <path d="M0,0 L140,0 L140,30 L20,30 Z" fill="#10121A" stroke="#00FFF0" strokeWidth="1"></path>
                        <text x="80" y="20" textAnchor="middle" fontWeight="bold" fontSize="12" fill="#00FFF0" fontFamily="'Cairo', sans-serif">جيم باس: يوم 1</text>
                    </g>
                )}
            </g>

            <foreignObject x="10" y="260" width="280" height="60" onMouseDown={(e) => e.stopPropagation()}>
                 <SocialNewsBodyEditor 
                    content={slot.title} 
                    onChange={(val) => onChange({ title: val })}
                    isEditing={editingField === 'title'}
                    setEditing={(val) => setEditingField(val ? 'title' : null)}
                    fontSize={24}
                    textAlign="center"
                    customStyle={{ 
                        color: "#FFFFFF", 
                        fontFamily: "Arial, sans-serif",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        filter: "drop-shadow(0 2px 4px #000)",
                        lineHeight: 1.1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                    }}
                    disableAutoEnglish={true}
                />
            </foreignObject>

            <g 
                transform="translate(20, 325)"
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <use href="#mg-glassDock" pointerEvents="none"></use>
                <g transform="translate(13, 8)">
                    {[
                        { key: 'PC', x: 0 },
                        { key: 'PS5', x: 52 },
                        { key: 'XSX', x: 104 },
                        { key: 'NSW', x: 156 },
                        { key: 'Cloud', x: 208 },
                    ].map((p) => {
                        const Icon = PLATFORM_ICONS[p.key];
                        const isActive = slot.platforms[p.key as keyof typeof slot.platforms];
                        return (
                            <g 
                                key={p.key} 
                                transform={`translate(${p.x}, 0)`} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformToggle(e, p.key as keyof typeof slot.platforms);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <rect x="-10" y="-10" width="44" height="44" fill="transparent" />
                                <g 
                                    color={isActive ? (p.key === 'NSW' ? '#FF0055' : '#00FFF0') : '#AAA'} 
                                    style={{ opacity: isActive ? 1 : 0.3 }}
                                    filter={isActive ? "url(#mg-activeGlow)" : "none"}
                                >
                                    <Icon width={24} height={24} pointerEvents="none" />
                                    {isActive && <rect x="0" y="28" width="24" height="2" fill="currentColor" pointerEvents="none"></rect>}
                                </g>
                            </g>
                        );
                    })}
                </g>
            </g>
        </g>
    );
}