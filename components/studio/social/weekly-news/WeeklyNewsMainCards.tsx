// components/studio/social/weekly-news/WeeklyNewsMainCards.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WeeklyNewsTemplateData, WeeklyCardData, NewsType, BadgeState } from './types';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import { PLATFORM_ICONS } from '../monthly-games/utils';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
    scale: number;
}

const NEWS_TYPE_CONFIG: Record<NewsType, { label: string, color: string }> = {
    official: { label: 'رسمي', color: '#00FFF0' },
    rumor: { label: 'إشاعة', color: '#F59E0B' },
    leak: { label: 'تسريب', color: '#DC2626' }
};

const PLATFORM_CONFIG: Record<string, { color: string, icon: any }> = {
    xbox: { color: '#10B981', icon: PLATFORM_ICONS['XSX'] },
    playstation: { color: '#3B82F6', icon: PLATFORM_ICONS['PS5'] },
    nintendo: { color: '#EF4444', icon: PLATFORM_ICONS['NSW'] },
    pc: { color: '#E2E8F0', icon: PLATFORM_ICONS['PC'] }
};

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
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!card.image) return;
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

    // ... Image Handlers ...
    const handleMouseDown = (e: React.MouseEvent) => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY }; initialImgPos.current = { ...card.imageSettings }; };
    const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; e.preventDefault(); e.stopPropagation(); const dx = (e.clientX - dragStart.current.x) / scale; const dy = (e.clientY - dragStart.current.y) / scale; onCardChange({ ...card, imageSettings: { ...card.imageSettings, x: initialImgPos.current.x + dx, y: initialImgPos.current.y + dy } }); };
    const handleMouseUp = () => setIsDragging(false);
    const handleWheel = (e: React.WheelEvent) => { e.stopPropagation(); const settings = card.imageSettings; const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001)); onCardChange({ ...card, imageSettings: { ...settings, scale: newScale } }); };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { if(ev.target?.result) { onCardChange({ ...card, image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } }); } }; reader.readAsDataURL(file); } };

    // --- Badge Logic ---
    const badges = card.badges || { type: 'official', xbox: false, playstation: false, nintendo: false, pc: false };

    const toggleBadgeType = () => {
        const types: NewsType[] = ['official', 'rumor', 'leak'];
        const nextIndex = (types.indexOf(badges.type) + 1) % types.length;
        onCardChange({ ...card, badges: { ...badges, type: types[nextIndex] } });
    };

    const togglePlatform = (key: 'xbox' | 'playstation' | 'nintendo' | 'pc') => {
        onCardChange({ ...card, badges: { ...badges, [key]: !badges[key] } });
    };

    const activeBadges = useMemo(() => {
        const list: any[] = [];
        const typeConfig = NEWS_TYPE_CONFIG[badges.type];
        list.push({ type: 'type', ...typeConfig, width: 80 });
        if (badges.playstation) list.push({ type: 'platform', ...PLATFORM_CONFIG.playstation, width: 45 });
        if (badges.xbox) list.push({ type: 'platform', ...PLATFORM_CONFIG.xbox, width: 45 });
        if (badges.nintendo) list.push({ type: 'platform', ...PLATFORM_CONFIG.nintendo, width: 45 });
        if (badges.pc) list.push({ type: 'platform', ...PLATFORM_CONFIG.pc, width: 45 });

        const BADGE_HEIGHT = 26;
        const DIAGONAL_OFFSET = 15;
        let currentY = 0;
        let prevBottomWidth = 0;
        
        const RIGHT_EDGE = 320; 

        return list.map((b, i) => {
            const isFirst = i === 0;
            const topWidth = isFirst ? b.width + 10 : prevBottomWidth;
            const bottomWidth = topWidth - DIAGONAL_OFFSET;
            prevBottomWidth = bottomWidth;
            
            const shape = `M ${RIGHT_EDGE},${currentY} L ${RIGHT_EDGE},${currentY + BADGE_HEIGHT} L ${RIGHT_EDGE - bottomWidth},${currentY + BADGE_HEIGHT} L ${RIGHT_EDGE - topWidth},${currentY} Z`;
            const cx = RIGHT_EDGE - (topWidth + bottomWidth) / 4; 
            const badgeY = currentY;
            currentY += BADGE_HEIGHT;
            return { ...b, shape, y: badgeY, cx };
        });
    }, [badges]);

    const settings = card.imageSettings;
    const totalScale = baseScale * settings.scale;
    const transform = `translate(${160 + settings.x} ${80 + settings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;
    const xPos = index * 340;

    return (
        <g transform={`translate(${xPos}, 0)`}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
        >
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>
            
            <g clipPath="url(#wn-platformClipV2)">
                <rect width="320" height="160" fill="#000000" />
                <g
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                     onWheel={handleWheel}
                     onDoubleClick={() => fileInputRef.current?.click()}
                     style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                     {/* Transparent Hit Area */}
                     <rect x="0" y="0" width="320" height="160" fill="transparent" />
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
            
            {/* BADGES */}
            <g transform="translate(0, 0)"> 
                {activeBadges.map((badge, i) => (
                    <g key={i} onClick={(e) => { e.stopPropagation(); if (badge.type === 'type') toggleBadgeType(); }} style={{ cursor: 'pointer' }}>
                        <path d={badge.shape} fill={badge.color} stroke="none" />
                        {badge.type === 'type' ? (
                            <text x={badge.cx} y={badge.y + 18} textAnchor="middle" fill="#000" fontWeight="900" fontSize="12" fontFamily="'Cairo', sans-serif">
                                {badge.label}
                            </text>
                        ) : (
                            <g transform={`translate(${badge.cx - 8}, ${badge.y + 5})`} color="#fff">
                                <badge.icon width={16} height={16} />
                            </g>
                        )}
                    </g>
                ))}
            </g>

             {/* PLATFORM CONTROLS ON HOVER */}
             <g transform="translate(20, -35)" opacity={isHovered ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
                 {['playstation', 'xbox', 'nintendo', 'pc'].map((p, i) => {
                     const isActive = badges[p as keyof BadgeState];
                     const cfg = PLATFORM_CONFIG[p];
                     return (
                         <g key={p} transform={`translate(${i * 30}, 0)`} onClick={(e) => { e.stopPropagation(); togglePlatform(p as any); }} style={{ cursor: 'pointer' }}>
                            <rect width="25" height="25" fill="#1A202C" stroke={isActive ? cfg.color : '#555'} rx="4" />
                            <g transform="translate(5, 5)" color={isActive ? cfg.color : '#888'}>
                                <cfg.icon width={15} height={15} />
                            </g>
                         </g>
                     )
                 })}
            </g>

            <foreignObject x={10} y={95} width={300} height={70}>
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
                    stylingVariant="card"
                    disableAutoEnglish
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


