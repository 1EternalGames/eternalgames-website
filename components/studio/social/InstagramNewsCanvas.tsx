// components/studio/social/InstagramNewsCanvas.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import SocialNewsBodyEditor from './SocialNewsBodyEditor';
import SpaceBackground from './shared/SpaceBackground';

export interface TemplateData {
    titleTop: string;
    titleBottom: string;
    subTitle: string; 
    body: string;
    source: string;
    image: string; 
    type: 'official' | 'rumor' | 'leak';
    footerHandle: string;
    imageSettings?: { x: number; y: number; scale: number };
}

interface InstagramNewsCanvasProps {
    data: TemplateData;
    onDataChange: (newData: Partial<TemplateData>) => void;
    scale?: number;
    currentSlide: number;
    totalSlides: number;
}

const TYPE_CONFIG = {
    official: { color: '#00FFF0', label: 'رسمي', iconPath1: "M 12 0 L 24 7 L 24 21 L 12 28 L 0 21 L 0 7 Z", iconPath2: "M 7 14 L 11 18 L 17 10" },
    rumor: { color: '#F59E0B', label: 'إشاعة', iconPath1: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z", iconPath2: "" }, 
    leak: { color: '#DC2626', label: 'تسريب', iconPath1: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z", iconPath2: "" } 
};

const DEFAULT_ACCENT = '#00FFF0';

// --- Font Scaling Logic ---
const calculateFontSize = (text: string, maxWidth: number, maxFontSize: number, minFontSize: number) => {
    if (!text) return maxFontSize;
    const plainText = text.replace(/<[^>]*>?/gm, '');
    const estimatedSize = maxWidth / (plainText.length * 0.55); 
    return Math.min(maxFontSize, Math.max(minFontSize, estimatedSize));
};

const calculateBodyFontSize = (text: string, width: number, height: number, maxFontSize: number) => {
    if (!text) return maxFontSize;
    const plainText = text.replace(/<[^>]*>?/gm, '');
    const area = width * height;
    const charCount = plainText.length || 1;
    const estimatedSize = Math.sqrt(area / (charCount * 1.5)); 
    return Math.min(maxFontSize, Math.max(16, estimatedSize));
};

// --- Seamless Editable Text Component ---
const EditableText = ({ 
    x, y, text, fontSize, align, style, onChange, isEditing, setEditing, width = 800,
    strokeWidth = 0, strokeColor = 'transparent', shadowStyle = {}
}: { 
    x: number, y: number, text: string, fontSize: number, align: 'start' | 'middle' | 'end', 
    style?: React.CSSProperties, onChange: (val: string) => void,
    isEditing: boolean, setEditing: (v: boolean) => void, width?: number,
    strokeWidth?: number, strokeColor?: string, shadowStyle?: React.CSSProperties
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    let foreignX = x;
    const textAlign = align === 'middle' ? 'center' : (align === 'start' ? 'right' : 'left'); 

    if (align === 'middle') foreignX = x - (width / 2);
    if (align === 'start') foreignX = x - width; 
    if (align === 'end') foreignX = x; 
    
    // Adjusted vertical alignment for input
    const foreignY = y - (fontSize * 1.62); 

    const inputColor = isFocused ? (style?.fill as string || '#FFFFFF') : 'transparent';

    return (
        <g onClick={(e) => { e.stopPropagation(); setEditing(true); }} style={{ cursor: 'text' }}>
            {!isFocused && (
                <g style={{ opacity: 1 }}>
                    {strokeWidth > 0 && (
                        <text 
                            x={x} y={y} 
                            textAnchor={align} 
                            style={{ ...shadowStyle, pointerEvents: 'none' }}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            fill={strokeColor}
                            fontSize={fontSize}
                            fontWeight={900}
                            fontFamily="'Cairo', sans-serif"
                        >
                            {text}
                        </text>
                    )}
                    <text 
                        x={x} y={y} 
                        textAnchor={align} 
                        style={{ ...style, pointerEvents: 'none' }}
                        fontSize={fontSize}
                        fontWeight={900}
                        fontFamily="'Cairo', sans-serif"
                    >
                        {text}
                    </text>
                </g>
            )}

            <foreignObject 
                x={foreignX} 
                y={foreignY} 
                width={width} 
                height={fontSize * 2.5} 
                style={{ pointerEvents: 'all' }} 
            >
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        setIsFocused(true);
                        setEditing(true);
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        setEditing(false);
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: inputColor,
                        fontSize: `${fontSize}px`,
                        fontFamily: "'Cairo', sans-serif",
                        fontWeight: 900,
                        textAlign: textAlign,
                        direction: 'rtl',
                        padding: 0,
                        margin: 0,
                        caretColor: '#fff',
                        textShadow: isFocused ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                        lineHeight: '1.2',
                        opacity: isFocused ? 1 : 0, 
                        cursor: 'text'
                    }}
                />
            </foreignObject>
        </g>
    );
};

export default function InstagramNewsCanvas({ data, onDataChange, scale = 1, currentSlide, totalSlides }: InstagramNewsCanvasProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const config = TYPE_CONFIG[data.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.official;
    const [editingField, setEditingField] = useState<string | null>(null);
    
    // Pan/Zoom State
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    
    const [imgDims, setImgDims] = useState({ width: 1080, height: 850 });
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        const img = new Image();
        img.src = data.image;
        img.onload = () => {
            const w = img.naturalWidth || 1080;
            const h = img.naturalHeight || 850;
            setImgDims({ width: w, height: h });
            const scaleW = 1080 / w;
            const scaleH = 850 / h;
            setBaseScale(Math.max(scaleW, scaleH));
        };
    }, [data.image]);

    // Handlers...
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) {
                    onDataChange({ 
                        image: ev.target.result as string,
                        imageSettings: { x: 0, y: 0, scale: 1 } 
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
             const reader = new FileReader();
            reader.onload = (ev) => { if(ev.target?.result) onDataChange({ image: ev.target.result as string, imageSettings: { x: 0, y: 0, scale: 1 } }); };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    };

    const toggleType = (e: React.MouseEvent) => {
        e.stopPropagation();
        const types: Array<'official' | 'rumor' | 'leak'> = ['official', 'rumor', 'leak'];
        const currentIndex = types.indexOf(data.type);
        const nextIndex = (currentIndex + 1) % types.length;
        onDataChange({ type: types[nextIndex] });
    };

    const titleTopSize = calculateFontSize(data.titleTop, 1000, 110, 50);
    const titleBottomSize = calculateFontSize(data.titleBottom, 700, 65, 35);
    const bodySize = calculateBodyFontSize(data.body, 880, 260, 30); 
    const titleTopStroke = Math.max(3, titleTopSize * 0.05); 

    const renderDots = () => {
        const dots = [];
        const spacing = 35; 
        const totalWidth = (totalSlides - 1) * spacing;
        const startX = -totalWidth / 2;
        for (let i = 0; i < totalSlides; i++) {
            const isActive = i === currentSlide;
            const x = startX + (i * spacing);
            dots.push(
                <g key={i} transform={`translate(${x}, 0)`}>
                    <rect x="-6" y="-6" width="12" height="12" fill={isActive ? config.color : "none"} stroke={isActive ? "none" : "#556070"} strokeWidth="2" transform="rotate(45)" style={{ transition: 'all 0.3s ease' }} />
                    {isActive && <rect x="-6" y="-6" width="12" height="12" fill={config.color} transform="rotate(45)" filter="url(#glowEffect)" opacity="0.5" />}
                </g>
            );
        }
        return dots;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        const settings = data.imageSettings || { x: 0, y: 0, scale: 1 };
        initialImgPos.current = { x: settings.x, y: settings.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / scale;
        const dy = (e.clientY - dragStart.current.y) / scale;
        const settings = data.imageSettings || { x: 0, y: 0, scale: 1 };
        onDataChange({ imageSettings: { ...settings, x: initialImgPos.current.x + dx, y: initialImgPos.current.y + dy } });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.stopPropagation(); setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const settings = data.imageSettings || { x: 0, y: 0, scale: 1 };
        const newScale = Math.max(0.1, Math.min(5, settings.scale - e.deltaY * 0.001));
        onDataChange({ imageSettings: { ...settings, scale: newScale } });
    };

    const imgSettings = data.imageSettings || { x: 0, y: 0, scale: 1 };
    const totalScale = baseScale * imgSettings.scale;
    const imageTransform = `translate(${540 + imgSettings.x} ${425 + imgSettings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    const clipPathData = "M 0,0 L 1080,0 L 1080,850 L 1000,800 L 80,800 L 0,850 Z";

    // DEFINE CLIP PATH FOR BOTTOM AREA (Where text resides)
    // Starts below the image cut (y=850) and goes down to 1350
    const bottomAreaClipPath = "M 0,850 L 80,800 L 1000,800 L 1080,850 L 1080,1350 L 0,1350 Z";

    return (
        <div 
            className="canvas-container"
            id="instagram-news-canvas"
            style={{ 
                width: `${1080 * scale}px`, 
                height: `${1350 * scale}px`,
                transformOrigin: 'top left',
                position: 'relative',
                boxShadow: `0 0 40px ${config.color}20`
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />

            <svg 
                viewBox="0 0 1080 1350" 
                width="100%" 
                height="100%" 
                xmlns="http://www.w3.org/2000/svg" 
                preserveAspectRatio="xMidYMid slice"
                style={{ backgroundColor: '#000', direction: 'rtl' }}
            >
                <defs>
                    <linearGradient id="imageFade" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="60%" stopColor="#000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000" stopOpacity="1" />
                    </linearGradient>
                    
                    <pattern id="diagScan" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="#000" strokeWidth="4" opacity="0.2" />
                    </pattern>

                    <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <filter id="titleShadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
                    </filter>

                    <filter id="grain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.05" />
                        </feComponentTransfer>
                    </filter>

                    <clipPath id="newsImageClip">
                        <path d={clipPathData} />
                    </clipPath>
                    
                    <clipPath id="bottomAreaClip">
                        <path d={bottomAreaClipPath} />
                    </clipPath>
                </defs>

                {/* BACKGROUND: Default dark */}
                <rect width="100%" height="100%" fill="#10121A" />
                
                {/* SPACE BACKGROUND: RESTRICTED TO BOTTOM AREA */}
                <g clipPath="url(#bottomAreaClip)">
                     <SpaceBackground />
                </g>

                <text x="540" y="600" textAnchor="middle" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="600" fill="#10121A" opacity="0.5" style={{ pointerEvents: 'none' }}>أخبار</text>

                {/* STATIC MASK GROUP FOR IMAGE */}
                <g clipPath="url(#newsImageClip)">
                    <g 
                        id="image-layer" 
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        onDoubleClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <image 
                            href={data.image} 
                            width={imgDims.width}
                            height={imgDims.height}
                            preserveAspectRatio="none"
                            transform={imageTransform}
                        />
                    </g>
                    
                    {/* STATIC OVERLAYS - Inside Clip */}
                    <rect x="0" y="500" width="1080" height="350" fill="url(#imageFade)" pointerEvents="none" />
                    <rect width="1080" height="850" fill="url(#diagScan)" opacity="0.3" pointerEvents="none" />
                </g>

                {/* TYPE BADGE */}
                <g onClick={toggleType} onDoubleClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
                    <g transform="translate(1080, 100) scale(-1, 1)">
                        <path d="M 0,0 L 260,0 L 290,60 L 0,60 Z" fill="#0B0D12" stroke="#1A202C" strokeWidth="2" />
                        <rect x="0" y="0" width="12" height="60" fill={config.color} filter="url(#glowEffect)" />
                    </g>
                    
                    <g transform="translate(1045, 140)">
                        <text x="0" y="0" textAnchor="start" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="36" fill="#FFF" letterSpacing="0" style={{ userSelect: 'none' }}>
                            {config.label}
                        </text>
                        <g transform="translate(-210, -22)">
                            <path d={config.iconPath1} fill="none" stroke={config.color} strokeWidth="1.5" />
                            {config.iconPath2 && <path d={config.iconPath2} fill="none" stroke={config.color} strokeWidth="2" />}
                        </g>
                    </g>
                </g>

                {/* FRAME PATH - RENDERED BEFORE TEXT */}
                <g pointerEvents="none">
                    <path d="M 0,1350 L 1080,1350 L 1080,850 L 1000,800 L 80,800 L 0,850 Z" fill="none" stroke="#1A202C" strokeWidth="2" /> {/* Removed opaque fill here to let BG show */}
                    <path d="M 0,850 L 80,800 L 80,900 L 100,920 L 420,920" fill="none" stroke={DEFAULT_ACCENT} strokeWidth="3" strokeLinecap="square" style={{ filter: `drop-shadow(0 0 5px ${DEFAULT_ACCENT})` }} />
                    <path d="M 1080,850 L 1000,800 L 1000,900 L 980,920 L 660,920" fill="none" stroke={DEFAULT_ACCENT} strokeWidth="3" strokeLinecap="square" style={{ filter: `drop-shadow(0 0 5px ${DEFAULT_ACCENT})` }} />

                    <g transform="translate(480, 1340)">
                        <path d="M 0,0 L 120,0 L 130,10 L -10,10 Z" fill="#151820" stroke="#333" strokeWidth="1" />
                        <g transform="translate(60, -15)">
                            {renderDots()}
                        </g>
                    </g>
                </g>

                {/* TITLE GROUP - RENDERED AFTER FRAME */}
                <g transform="translate(540, 780)">
                    {/* Title Top - Positioned relative to separator */}
                    <EditableText 
                        x={0} y={-25} 
                        text={data.titleTop} 
                        fontSize={titleTopSize}
                        width={1000} 
                        align="middle"
                        style={{ fill: "#FFFFFF", filter: "url(#titleShadow)" }}
                        strokeColor="#000"
                        strokeWidth={titleTopStroke}
                        shadowStyle={{ opacity: 0.8 }}
                        onChange={(val) => onDataChange({ titleTop: val })}
                        isEditing={editingField === 'titleTop'}
                        setEditing={(val) => setEditingField(val ? 'titleTop' : null)}
                    />
                    
                    {/* Title Bottom - Positioned explicitly below separator - Dragged down slightly */}
                    <EditableText 
                        x={0} y={80} 
                        text={data.titleBottom} 
                        fontSize={titleBottomSize}
                        width={700}
                        align="middle"
                        style={{ 
                            fill: DEFAULT_ACCENT, 
                            textTransform: 'uppercase', 
                            filter: `drop-shadow(0 0 10px ${DEFAULT_ACCENT}80)` 
                        }}
                        onChange={(val) => onDataChange({ titleBottom: val })}
                        isEditing={editingField === 'titleBottom'}
                        setEditing={(val) => setEditingField(val ? 'titleBottom' : null)}
                    />

                    {/* Separator Line */}
                    <rect x="-400" y="-10" width="800" height="2" fill={DEFAULT_ACCENT} opacity="0.5" />
                </g>

                {/* BODY CONTENT */}
                <g transform="translate(0, 950)">
                    <rect x="980" y="0" width="4" height="30" fill="#556070" />
                    
                    <EditableText
                        x={965} y={20}
                        text={data.source || 'المصدر: خاص'}
                        fontSize={18}
                        width={600}
                        align="start" 
                        style={{ fill: DEFAULT_ACCENT, letterSpacing: 0 }}
                        onChange={(val) => onDataChange({ source: val })}
                        isEditing={editingField === 'source'}
                        setEditing={(val) => setEditingField(val ? 'source' : null)}
                    />

                    {/* Rich Text Editor Container */}
                    <foreignObject x="100" y="50" width="880" height="350">
                         <SocialNewsBodyEditor 
                            content={data.body} 
                            onChange={(html) => onDataChange({ body: html })}
                            fontSize={bodySize}
                            isEditing={editingField === 'body'}
                            setEditing={(val) => setEditingField(val ? 'body' : null)}
                         />
                    </foreignObject>
                </g>

                <rect width="100%" height="100%" filter="url(#grain)" opacity="0.08" pointerEvents="none" style={{ mixBlendMode: 'overlay' }} />
                
            </svg>
        </div>
    );
}


