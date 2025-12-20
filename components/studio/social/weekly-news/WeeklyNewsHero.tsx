// components/studio/social/weekly-news/WeeklyNewsHero.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WeeklyNewsTemplateData, NewsType, BadgeState } from './types';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import EditableText from '../shared/EditableText';
import { PLATFORM_ICONS } from '../monthly-games/utils';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
    scale: number;
}

const NEWS_TYPE_CONFIG: Record<NewsType, { label: string, color: string }> = {
    official: { label: 'رسمي', color: '#00FFF0' },
    rumor: { label: 'إشاعة', color: '#FFD700' },
    leak: { label: 'تسريب', color: '#DC2626' }
};

const PLATFORM_CONFIG: Record<string, { color: string, icon: any }> = {
    xbox: { color: '#10B981', icon: PLATFORM_ICONS['XSX'] },
    playstation: { color: '#3B82F6', icon: PLATFORM_ICONS['PS5'] },
    nintendo: { color: '#EF4444', icon: PLATFORM_ICONS['NSW'] },
    pc: { color: '#E2E8F0', icon: PLATFORM_ICONS['PC'] }
};

export default function WeeklyNewsHero({ data, onChange, scale }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    const [editingField, setEditingField] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    
    // Image Dimensions
    const [imgDims, setImgDims] = useState({ width: 1080, height: 350 });
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        if (!data.hero.image) return;
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

    // Image Handlers
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onChange({ hero: { ...data.hero, image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } } });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    const handleMouseDown = (e: React.MouseEvent) => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY }; initialImgPos.current = { ...data.hero.imageSettings }; };
    const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; e.preventDefault(); e.stopPropagation(); const dx = (e.clientX - dragStart.current.x) / scale; const dy = (e.clientY - dragStart.current.y) / scale; onChange({ hero: { ...data.hero, imageSettings: { ...data.hero.imageSettings, x: initialImgPos.current.x + dx, y: initialImgPos.current.y + dy } } }); };
    const handleMouseUp = () => setIsDragging(false);
    const handleWheel = (e: React.WheelEvent) => { e.stopPropagation(); const settings = data.hero.imageSettings; const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001)); onChange({ hero: { ...data.hero, imageSettings: { ...settings, scale: newScale } } }); };

    // --- Badge Logic ---
    const badges = data.hero.badges || { type: 'official', xbox: false, playstation: false, nintendo: false, pc: false };

    const toggleBadgeType = () => {
        const types: NewsType[] = ['official', 'rumor', 'leak'];
        const nextIndex = (types.indexOf(badges.type) + 1) % types.length;
        onChange({ hero: { ...data.hero, badges: { ...badges, type: types[nextIndex] } } });
    };

    const togglePlatform = (key: 'xbox' | 'playstation' | 'nintendo' | 'pc') => {
        onChange({ hero: { ...data.hero, badges: { ...badges, [key]: !badges[key] } } });
    };

    const activeBadges = useMemo(() => {
        const list: any[] = [];
        const typeConfig = NEWS_TYPE_CONFIG[badges.type];
        list.push({ type: 'type', ...typeConfig, width: 90 });
        if (badges.playstation) list.push({ type: 'platform', ...PLATFORM_CONFIG.playstation, width: 50 });
        if (badges.xbox) list.push({ type: 'platform', ...PLATFORM_CONFIG.xbox, width: 50 });
        if (badges.nintendo) list.push({ type: 'platform', ...PLATFORM_CONFIG.nintendo, width: 50 });
        if (badges.pc) list.push({ type: 'platform', ...PLATFORM_CONFIG.pc, width: 50 });

        const BADGE_HEIGHT = 30;
        const DIAGONAL_OFFSET = 15;
        let currentY = 0;
        let prevBottomWidth = 0;
        const RIGHT_EDGE = 1080; 

        return list.map((b, i) => {
            const isFirst = i === 0;
            const topWidth = isFirst ? b.width + 20 : prevBottomWidth;
            const bottomWidth = topWidth - DIAGONAL_OFFSET;
            prevBottomWidth = bottomWidth;
            
            const shape = `M ${RIGHT_EDGE},${currentY} L ${RIGHT_EDGE},${currentY + BADGE_HEIGHT} L ${RIGHT_EDGE - bottomWidth},${currentY + BADGE_HEIGHT} L ${RIGHT_EDGE - topWidth},${currentY} Z`;
            const cx = RIGHT_EDGE - (topWidth + bottomWidth) / 4; 
            const badgeY = currentY;
            currentY += BADGE_HEIGHT;
            return { ...b, shape, y: badgeY, cx };
        });
    }, [badges]);

    const settings = data.hero.imageSettings;
    const totalScale = baseScale * settings.scale;
    const transform = `translate(${540 + settings.x} ${175 + settings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    return (
        <g transform="translate(0, 110)"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}
        >
            <foreignObject width="0" height="0">
                 <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </foreignObject>

            <g clipPath="url(#wn-heroClipNotched)">
                 <rect width="1080" height="350" fill="#000000" />
                 <g 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onDoubleClick={() => fileInputRef.current?.click()}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    {/* Transparent rect to ensure clickability when empty */}
                    <rect x="0" y="0" width="1080" height="350" fill="transparent" />
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

            <g transform="translate(0, 0)"> 
                {activeBadges.map((badge, i) => (
                    <g key={i} onClick={(e) => { e.stopPropagation(); if (badge.type === 'type') toggleBadgeType(); }} style={{ cursor: 'pointer' }}>
                        <path d={badge.shape} fill={badge.color} stroke="none" />
                        {badge.type === 'type' ? (
                            <text x={badge.cx} y={badge.y + 20} textAnchor="middle" fill="#000" fontWeight="900" fontSize="14" fontFamily="'Cairo', sans-serif">
                                {badge.label}
                            </text>
                        ) : (
                            <g transform={`translate(${badge.cx - 10}, ${badge.y + 5})`} color="#fff">
                                <badge.icon width={20} height={20} />
                            </g>
                        )}
                    </g>
                ))}
            </g>

            <g transform="translate(850, 0)" opacity={isHovered ? 1 : 0} style={{ transition: 'opacity 0.2s' }}>
                 {['playstation', 'xbox', 'nintendo', 'pc'].map((p, i) => {
                     const isActive = badges[p as keyof BadgeState];
                     const cfg = PLATFORM_CONFIG[p];
                     return (
                         <g key={p} transform={`translate(${i * 40}, 0)`} onClick={(e) => { e.stopPropagation(); togglePlatform(p as any); }} style={{ cursor: 'pointer' }}>
                            <rect width="35" height="35" fill="#1A202C" stroke={isActive ? cfg.color : '#555'} rx="4" />
                            <g transform="translate(7.5, 7.5)" color={isActive ? cfg.color : '#888'}>
                                <cfg.icon width={20} height={20} />
                            </g>
                         </g>
                     )
                 })}
            </g>

            <g transform="translate(1040, 235)">
                <foreignObject x={-900} y={-30} width={900} height={140}>
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
                        stylingVariant="hero"
                        disableAutoEnglish 
                    />
                </foreignObject>
            </g>
        </g>
    );
}


