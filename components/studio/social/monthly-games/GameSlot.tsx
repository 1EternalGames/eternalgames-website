// components/studio/social/monthly-games/GameSlot.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
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
    sizeScale?: number; // Scaling factor for the card itself
}

// Config: GamePass/PSPlus (English, Cyan), Exclusive (Arabic, Red), Price (Gold)
const BADGE_CONFIG = {
    gamePass: { color: '#00FFF0', text: 'GamePass', icon: 'GP', minWidth: 110 },
    psPlus: { color: '#00FFF0', text: 'PS Plus', icon: 'PS', minWidth: 100 },
    exclusive: { color: '#FF0000', text: 'حصرية', icon: 'EX', minWidth: 90 },
    price: { color: '#FFD700', text: '$', icon: '$', minWidth: 60 },
};

// Fixed Order: GamePass -> PS Plus -> Exclusive -> Price
const BADGE_KEYS = ['gamePass', 'psPlus', 'exclusive', 'price'] as const;

export default function GameSlot({ slot, onChange, x, y, scale, sizeScale = 1 }: GameSlotProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    
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
        const dx = (e.clientX - dragStart.current.x) / (scale * sizeScale);
        const dy = (e.clientY - dragStart.current.y) / (scale * sizeScale);
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

    // --- Badge Logic ---
    const toggleBadge = (key: string) => {
        if (key === 'price') {
            onChange({ badges: { ...slot.badges, price: { ...slot.badges.price, active: !slot.badges.price.active } } });
        } else {
            onChange({ badges: { ...slot.badges, [key]: !slot.badges[key as keyof typeof slot.badges] } });
        }
    };

    const updatePriceText = (text: string) => {
        onChange({ badges: { ...slot.badges, price: { ...slot.badges.price, text } } });
    };

    // --- Dynamic Width Calculation (Top-Down Cascade) ---
    const calculatedBadges = useMemo(() => {
        const DIAGONAL_OFFSET = 20; // Step for diagonal cut

        // 1. Filter active badges in fixed order
        const activeBadges = BADGE_KEYS.map(key => {
            if (key === 'price') {
                return slot.badges.price.active ? { ...BADGE_CONFIG.price, text: slot.badges.price.text, key } : null;
            }
            return slot.badges[key as keyof typeof slot.badges] ? { ...BADGE_CONFIG[key], key } : null;
        }).filter((b): b is NonNullable<typeof b> => b !== null);

        if (activeBadges.length === 0) return [];

        const processedBadges: any[] = [];
        
        // 2. Calculate Top Badge Width (The Anchor)
        const firstBadge = activeBadges[0];
        let topWidth = firstBadge.minWidth;

        // If price is the top badge, adjust width to fit text exactly + padding
        if (firstBadge.key === 'price') {
            const charCount = firstBadge.text.length;
            topWidth = Math.max(70, 50 + (charCount * 12));
        }

        processedBadges.push({
            ...firstBadge,
            topWidth: topWidth,
            bottomWidth: topWidth - DIAGONAL_OFFSET
        });

        // 3. Calculate subsequent widths (Strictly decreasing)
        let previousBottomWidth = topWidth - DIAGONAL_OFFSET;

        for (let i = 1; i < activeBadges.length; i++) {
            const badge = activeBadges[i];
            const currentTopWidth = previousBottomWidth;
            const currentBottomWidth = currentTopWidth - DIAGONAL_OFFSET;
            
            processedBadges.push({
                ...badge,
                topWidth: currentTopWidth,
                bottomWidth: currentBottomWidth
            });
            
            previousBottomWidth = currentBottomWidth;
        }
        
        return processedBadges;
    }, [slot.badges]);

    const imgSettings = slot.imageSettings || { x: 0, y: 0, scale: 1 };
    const totalScale = baseScale * imgSettings.scale;
    const imageTransform = `translate(${150 + imgSettings.x} ${190 + imgSettings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    // Badge Geometry Constants
    const BADGE_HEIGHT = 30; 

    return (
        <g 
            transform={`translate(${x}, ${y}) scale(${sizeScale})`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
            
            <path d="M 0,0 L 300,0 L 300,120 L 290,125 L 300,130 L 300,250 L 290,260 L 290,290 L 300,300 L 300,350 L 270,380 L 30,380 L 0,350 L 0,300 L 10,290 L 10,260 L 0,250 L 0,130 L 10,125 L 0,120 Z" 
                  fill="none" stroke="#556070" strokeWidth="2" pointerEvents="none" />
            
            <path d="M 0,300 L 0,350 L 30,380" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 300,300 L 300,350 L 270,380" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 10,260 L 10,290" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />
            <path d="M 290,260 L 290,290" fill="none" stroke="#00FFF0" strokeWidth="4" filter="url(#mg-activeGlow)" />

            {/* --- DATE TAG (RIGHT SIDE, FLIPPED) --- */}
            <g 
                transform="translate(240,0)" 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setEditingField('day')} // Explicit trigger
                style={{ cursor: 'text' }}
            >
                <g transform="scale(-1, 1) translate(-60, 0)">
                    <use href="#mg-cyberDateTag"></use>
                </g>
                <EditableText
                    x={30} 
                    y={35} 
                    text={slot.day}
                    // --- ADJUST FONT HERE (DATE) ---
                    fontSize={36}
                    fontWeight={900}
                    fontFamily="'Dystopian', 'Cairo', sans-serif"
                    // ------------------------------
                    align="middle"
                    style={{ fill: "#050505" }}
                    inputStyle={{ direction: 'ltr', fontFamily: "'Dystopian', 'Cairo', sans-serif" }}
                    onChange={(val) => onChange({ day: val })}
                    isEditing={editingField === 'day'}
                    setEditing={(val) => setEditingField(val ? 'day' : null)}
                    width={60}
                    inputDy={-5}
                />
            </g>
            
            {/* --- CASCADING BADGE STACK (LEFT SIDE) --- */}
            <g transform="translate(0, 0)">
                {calculatedBadges.map((badge, i) => {
                    const topY = i * BADGE_HEIGHT;
                    const bottomY = (i + 1) * BADGE_HEIGHT;
                    
                    const path = `
                        M 0,${topY} 
                        L ${badge.topWidth},${topY} 
                        L ${badge.bottomWidth},${bottomY} 
                        L 0,${bottomY} 
                        Z
                    `;
                    
                    const centerX = (badge.topWidth + badge.bottomWidth) / 4; 
                    const centerY = topY + (BADGE_HEIGHT / 2) + 5;
                    
                    const textColor = badge.color;

                    return (
                        <g 
                            key={badge.key} 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(badge.key === 'price') setEditingField('price');
                            }}
                            style={{ cursor: badge.key === 'price' ? 'text' : 'default' }}
                        >
                            <path d={path} fill="#050505" stroke={badge.color} strokeWidth="1.5"></path>
                            <path d={path} fill={badge.color} fillOpacity="0.15" stroke="none"></path>
                            
                            {badge.key === 'price' ? (
                                <EditableText
                                    x={centerX} y={centerY}
                                    text={badge.text}
                                    // --- ADJUST FONT HERE (PRICE BADGE) ---
                                    fontSize={19}
                                    fontWeight={700}
                                    fontFamily="'Dystopian', 'Cairo', sans-serif"
                                    // -------------------------------------
                                    align="middle"
                                    style={{ fill: badge.color }}
                                    inputStyle={{ direction: 'ltr' }}
                                    onChange={updatePriceText}
                                    isEditing={editingField === 'price'}
                                    setEditing={(val) => setEditingField(val ? 'price' : null)}
                                    width={badge.topWidth}
                                />
                            ) : (
                                <text 
                                    x={centerX} y={centerY} 
                                    textAnchor="middle" 
                                    // --- ADJUST FONT HERE (STATIC BADGES) ---
                                    fontWeight="bold" 
                                    fontSize="16" 
                                    fontFamily="'Dystopian', 'Cairo', sans-serif" 
                                    // ----------------------------------------
                                    fill={textColor}
                                    pointerEvents="none"
                                >
                                    {badge.text}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
            
            {/* --- BADGE TOGGLE CONTROLS (Visible on Hover) --- */}
            <g 
                transform="translate(80, -30)" 
                opacity={isHovered ? 1 : 0} 
                style={{ transition: 'opacity 0.2s' }}
            >
                {BADGE_KEYS.map((key, i) => {
                    const config = BADGE_CONFIG[key];
                    const isActive = key === 'price' ? slot.badges.price.active : slot.badges[key as keyof typeof slot.badges];
                    
                    return (
                        <g 
                            key={key} 
                            transform={`translate(${i * 35}, 0)`}
                            onClick={(e) => { e.stopPropagation(); toggleBadge(key); }}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect width="30" height="20" rx="4" fill={isActive ? config.color : "#1A202C"} stroke={config.color} strokeWidth="1" />
                            <text x="15" y="14" textAnchor="middle" fill={isActive ? "#000" : config.color} fontSize="10" fontWeight="bold">
                                {config.icon}
                            </text>
                        </g>
                    );
                })}
            </g>

            <foreignObject x="10" y="260" width="280" height="60" onMouseDown={(e) => e.stopPropagation()}>
                 <SocialNewsBodyEditor 
                    content={slot.title} 
                    onChange={(val) => onChange({ title: val })}
                    isEditing={editingField === 'title'}
                    setEditing={(val) => setEditingField(val ? 'title' : null)}
                    // --- ADJUST FONT HERE (GAME TITLE) ---
                    fontSize={30}
                    // -------------------------------------
                    textAlign="center"
                    customStyle={{ 
                        color: "#FFFFFF", 
                        fontFamily: "'Dystopian', 'Cairo', sans-serif",
                        fontWeight: 900,
                        textTransform: "none",
                        filter: "drop-shadow(0 2px 4px #000)",
                        lineHeight: 1.1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                    }}
                    disableAutoEnglish={true}
                    autoHeight={true} 
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
                        { key: 'PS5', x: 70 },
                        { key: 'XSX', x: 140 },
                        { key: 'NSW', x: 210 },
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