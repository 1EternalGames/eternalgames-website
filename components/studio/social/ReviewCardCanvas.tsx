// components/studio/social/ReviewCardCanvas.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';

export interface ReviewTemplateData {
    id: string;
    gameTitleAr: string;
    gameTitleEnTop: string;
    gameTitleEnBottom: string;
    score: string;
    rank: string;
    status: string;
    verdict: string;
    pros: string[];
    cons: string[];
    platforms: {
        PC: boolean;
        PS5: boolean;
        XSX: boolean;
        NSW: boolean;
    };
    techSpecs: {
        res: string;
        fps: string;
        hdr: string;
    };
    image: string;
    imageSettings: { x: number; y: number; scale: number };
}

interface ReviewCardCanvasProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    scale?: number;
}

// --- Text Layout Utility ---
const calculateWrappedLines = (text: string, fontSize: number, maxWidth: number, fontWeight: number | string = 700, fontFamily: string = "'Cairo', sans-serif") => {
    if (typeof document === 'undefined') return [text];
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [text];

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

// --- Helper Components ---

const DynamicTextBlock = ({ 
    lines, x, y, lineHeight, fontSize, align, color, firstWordColor, style 
}: { 
    lines: string[], x: number, y: number, lineHeight: number, fontSize: number, align: 'start' | 'middle' | 'end', color: string, firstWordColor?: string, style?: React.CSSProperties
}) => {
    return (
        <g style={{ pointerEvents: 'none' }}>
            {lines.map((line, i) => (
                <text 
                    key={i} 
                    x={x} 
                    y={y + (i * lineHeight)} 
                    textAnchor={align} 
                    fill={color}
                    fontSize={fontSize}
                    fontFamily="'Cairo', sans-serif"
                    fontWeight={700}
                    style={style}
                >
                    {i === 0 && firstWordColor ? (
                        <>
                            <tspan fill={firstWordColor}>{line.split(' ')[0]}</tspan>
                            <tspan fill={color}> {line.split(' ').slice(1).join(' ')}</tspan>
                        </>
                    ) : (
                        line
                    )}
                </text>
            ))}
        </g>
    );
};

// --- Editable Text Component ---
const EditableText = ({ 
    x, y, text, fontSize, align, style, onChange, isEditing, setEditing, width = 400,
    fontFamily = "'Cairo', sans-serif", fontWeight = 700, lineHeight = 1.2
}: { 
    x: number, y: number, text: string, fontSize: number, align: 'start' | 'middle' | 'end', 
    style?: React.CSSProperties, onChange: (val: string) => void,
    isEditing: boolean, setEditing: (v: boolean) => void, width?: number,
    fontFamily?: string, fontWeight?: number, lineHeight?: number
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
    if (align === 'start') foreignX = x; 
    if (align === 'end') foreignX = x - width; 
    
    // ADJUSTMENT: Center input vertically over SVG text baseline
    const foreignY = y - (fontSize * 1.15); 

    return (
        <g onClick={(e) => { e.stopPropagation(); setEditing(true); }} style={{ cursor: 'text' }}>
            {!isFocused && (
                <text 
                    x={x} y={y} 
                    textAnchor={align} 
                    style={{ ...style, pointerEvents: 'none' }}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    fontFamily={fontFamily}
                    onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                >
                    {text}
                </text>
            )}

            <foreignObject x={foreignX} y={foreignY} width={width} height={fontSize * 2.5} style={{ pointerEvents: (isEditing || isFocused) ? 'auto' : 'none' }}>
                {(isEditing || isFocused) && (
                    <input
                        ref={inputRef}
                        value={text}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => { setIsFocused(false); setEditing(false); }}
                        // FIX: Use dir prop, remove direction from style
                        dir="auto"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: isFocused ? '#fff' : 'transparent',
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            fontWeight: fontWeight,
                            textAlign: textAlign,
                            padding: 0,
                            margin: 0,
                            caretColor: '#00FFF0',
                            textShadow: 'none',
                            lineHeight: lineHeight,
                        }}
                    />
                )}
            </foreignObject>
        </g>
    );
};

export default function ReviewCardCanvas({ data, onDataChange, scale = 1 }: ReviewCardCanvasProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingField, setEditingField] = useState<string | null>(null);

    // Pan/Zoom State
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialImgPos = useRef({ x: 0, y: 0 });
    
    // Image Dimensions
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

    // --- Dynamic Layout Calculations ---
    const verdictFontSize = 20;
    const verdictLineHeight = 35;
    const verdictWidth = 420;
    
    const prosConsFontSize = 18;
    const prosConsLineHeight = 32;
    const prosConsWidth = 500;

    const verdictLines = useMemo(() => calculateWrappedLines(data.verdict, verdictFontSize, verdictWidth, 600), [data.verdict]);
    const verdictHeight = verdictLines.length * verdictLineHeight;
    
    const prosLayout = useMemo(() => {
        let currentY = 0;
        return data.pros.map(pro => {
            const lines = calculateWrappedLines(pro, prosConsFontSize, prosConsWidth);
            const height = lines.length * prosConsLineHeight;
            const y = currentY;
            currentY += height + 15;
            return { lines, y, height };
        });
    }, [data.pros]);
    const totalProsHeight = prosLayout.reduce((acc, item) => Math.max(acc, item.y + item.height), 0);

    const consLayout = useMemo(() => {
        let currentY = 0;
        return data.cons.map(con => {
            const lines = calculateWrappedLines(con, prosConsFontSize, prosConsWidth);
            const height = lines.length * prosConsLineHeight;
            const y = currentY;
            currentY += height + 15;
            return { lines, y, height };
        });
    }, [data.cons]);
    
    const startY_Verdict = 320;
    const startY_Pros = startY_Verdict + verdictHeight + 50; 
    const startY_Cons = startY_Pros + totalProsHeight + 100;

    // --- Handlers ---
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

    const handlePlatformToggle = (key: keyof typeof data.platforms) => {
        onDataChange({ platforms: { ...data.platforms, [key]: !data.platforms[key] } });
    };

    // Transform Logic
    const imgSettings = data.imageSettings;
    const totalScale = baseScale * imgSettings.scale;
    const imageTransform = `translate(${270 + imgSettings.x} ${675 + imgSettings.y}) scale(${totalScale}) translate(${-imgDims.width / 2} ${-imgDims.height / 2})`;

    const scoreNum = parseFloat(data.score) || 0;
    const perimeter = 480; 
    const dashArray = `${(scoreNum / 10) * perimeter} ${perimeter}`;

    // --- Cyan Frame Path Definition ---
    const cyanFramePath = "M 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350";

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
        >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />

            <svg 
                viewBox="0 0 1080 1350" 
                width="100%" 
                height="100%" 
                xmlns="http://www.w3.org/2000/svg" 
                preserveAspectRatio="xMidYMid slice"
                style={{ backgroundColor: '#050505', direction: 'ltr' }}
            >
                <defs>
                    <linearGradient id="review-monolithFade" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.9"></stop>
                        <stop offset="60%" stopColor="#000" stopOpacity="0.1"></stop>
                        <stop offset="100%" stopColor="#000" stopOpacity="0"></stop>
                    </linearGradient>

                    <linearGradient id="review-glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#151820" stopOpacity="0.95"></stop>
                        <stop offset="100%" stopColor="#080A0F" stopOpacity="0.98"></stop>
                    </linearGradient>

                    <linearGradient id="review-titleHeaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#151820"></stop>
                        <stop offset="100%" stopColor="#0B0D12"></stop>
                    </linearGradient>

                    <linearGradient id="review-proGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#00FFF0" stopOpacity="0"></stop>
                    </linearGradient>
                    
                    <linearGradient id="review-conGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#FF0055" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#FF0055" stopOpacity="0"></stop>
                    </linearGradient>

                    <linearGradient id="review-activeModule" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0F1115"></stop>
                        <stop offset="100%" stopColor="#050608"></stop>
                    </linearGradient>

                     <pattern id="review-inactiveModule" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                         <line x1="0" y1="0" x2="10" y2="10" stroke="#1A202C" strokeWidth="1" />
                    </pattern>

                    <pattern id="review-microGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="40" height="40" fill="none" stroke="#1A202C" strokeWidth="1" opacity="0.3"></rect>
                        <circle cx="20" cy="20" r="1" fill="#00FFF0" opacity="0.3"></circle>
                    </pattern>

                    <pattern id="review-hexTech" x="0" y="0" width="20" height="34.64" patternUnits="userSpaceOnUse">
                        <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke="#00FFF0" strokeWidth="0.5" opacity="0.1"></path>
                    </pattern>

                    <filter id="review-cyanGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="coloredBlur"></feMergeNode>
                            <feMergeNode in="SourceGraphic"></feMergeNode>
                        </feMerge>
                    </filter>
                    
                     <filter id="review-redGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="coloredBlur"></feMergeNode>
                            <feMergeNode in="SourceGraphic"></feMergeNode>
                        </feMerge>
                    </filter>

                    <filter id="review-grain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"></feTurbulence>
                        <feColorMatrix type="saturate" values="0"></feColorMatrix>
                    </filter>

                    <clipPath id="review-monolithClip">
                        <path d="M 0,0 L 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350 L 0,1350 Z"></path>
                    </clipPath>

                    <clipPath id="review-prismClip">
                        <path d="M 40,0 L 460,0 L 460,180 L 420,220 L 0,220 L 0,40 Z"></path>
                    </clipPath>
                    
                    <clipPath id="review-moduleClip">
                        <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z"></path>
                    </clipPath>

                    <clipPath id="review-titleBodyClip">
                        <path d="M 0,0 L 480,0 L 480,90 L 460,110 L 0,110 Z"></path>
                    </clipPath>
                </defs>

                {/* BACKGROUND */}
                <rect width="100%" height="100%" fill="#050505"></rect>
                <rect x="540" y="0" width="540" height="1350" fill="url(#review-microGrid)"></rect>
                 <text x="810" y="700" textAnchor="middle" fontFamily="'Impact', sans-serif" fontWeight="900" fontSize="600" fill="#10121A" opacity="0.5">
                    {data.gameTitleEnBottom ? data.gameTitleEnBottom.charAt(0) : 'R'}
                 </text>

                {/* IMAGE GROUP WITH CLIP PATH */}
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

                {/* Frame - Outside Clip - Enhanced Cyan Glow */}
                <path className="frame-outline" d="M 0,0 L 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350 L 0,1350" fill="none" stroke="#556070" strokeWidth="3" pointerEvents="none"></path>
                {/* 1. Solid base layer for visibility */}
                <path d={cyanFramePath} stroke="#00FFF0" strokeWidth="4" fill="none" pointerEvents="none"></path>
                {/* 2. Glow layer on top */}
                <path d={cyanFramePath} stroke="#00FFF0" strokeWidth="6" fill="none" filter="url(#review-cyanGlow)" opacity="0.8" pointerEvents="none"></path>

                {/* Title Deck */}
                <g transform="translate(20, 1150)">
                    <path d="M 0,0 L 460,0 L 480,25 L 480,30 L 0,30 Z" fill="url(#review-titleHeaderGradient)"></path>
                    <rect x="0" y="0" width="150" height="2" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
                    <rect x="150" y="0" width="310" height="1" fill="#556070"></rect>
                    
                    <EditableText 
                        x={470} y={20} 
                        text={data.gameTitleAr} 
                        fontSize={16} 
                        align="end" 
                        style={{ fill: "#E2E8F0" }}
                        isEditing={editingField === 'gameTitleAr'}
                        setEditing={(v) => setEditingField(v ? 'gameTitleAr' : null)}
                        onChange={(val) => onDataChange({ gameTitleAr: val })}
                        width={450}
                    />
                    
                    <g transform="translate(0, 30)">
                        <path d="M 0,0 L 480,0 L 480,90 L 460,110 L 0,110 Z" fill="#050608" opacity="0.95"></path>
                        <rect x="0" y="0" width="480" height="110" fill="url(#review-hexTech)" clipPath="url(#review-titleBodyClip)" opacity="0.2"></rect>
                        <rect x="0" y="0" width="6" height="110" fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>

                        <g transform="translate(25, 45)">
                                <EditableText 
                                x={0} y={0} 
                                text={data.gameTitleEnTop} 
                                fontSize={44} 
                                align="start" 
                                style={{ fill: "#FFFFFF", letterSpacing: "-1px" }}
                                fontFamily="Arial, sans-serif"
                                fontWeight={900}
                                isEditing={editingField === 'gameTitleEnTop'}
                                setEditing={(v) => setEditingField(v ? 'gameTitleEnTop' : null)}
                                onChange={(val) => onDataChange({ gameTitleEnTop: val })}
                                width={450}
                            />
                            
                            <EditableText 
                                x={0} y={45} 
                                text={data.gameTitleEnBottom} 
                                fontSize={48} 
                                align="start" 
                                style={{ fill: "#00FFF0", filter: "drop-shadow(0 0 8px rgba(0,255,240,0.5))" }}
                                fontFamily="Impact, sans-serif"
                                fontWeight={400}
                                isEditing={editingField === 'gameTitleEnBottom'}
                                setEditing={(v) => setEditingField(v ? 'gameTitleEnBottom' : null)}
                                onChange={(val) => onDataChange({ gameTitleEnBottom: val })}
                                width={450}
                            />
                        </g>
                    </g>
                </g>

                {/* ========================================== */}
                {/* RIGHT: DATA PANEL                          */}
                {/* ========================================== */}
                
                {/* 1. HEADER & RATING (Lifted to y=40) */}
                <g transform="translate(580, 40)">
                    <path d="M 40,0 L 460,0 L 460,180 L 420,220 L 0,220 L 0,40 Z" fill="url(#review-glassGradient)" stroke="#00FFF0" strokeWidth="1" strokeOpacity="0.3"></path>
                    <rect x="0" y="0" width="460" height="220" fill="url(#review-hexTech)" clipPath="url(#review-prismClip)"></rect>

                    {/* SCORE CIRCLE */}
                    <g transform="translate(350, 110)">
                        <path d="M 0,-80 L 70,-40 L 70,40 L 0,80 L -70,40 L -70,-40 Z" fill="#0B0D12" stroke="#1A202C" strokeWidth="2"></path>
                        <path d="M 0,-80 L 70,-40 L 70,40 L 0,80 L -70,40 L -70,-40 Z" fill="none" stroke="#00FFF0" strokeWidth="5" strokeDasharray={dashArray} strokeLinecap="round" filter="url(#review-cyanGlow)" transform="rotate(0)"></path>
                        <path d="M 0,-60 L 52,-30 L 52,30 L 0,60 L -52,30 L -52,-30 Z" fill="none" stroke="#556070" strokeWidth="1" opacity="0.5"></path>

                        <EditableText 
                            x={0} y={25} 
                            text={data.score} 
                            fontSize={70} 
                            align="middle" 
                            style={{ fill: "#FFFFFF", letterSpacing: "-2px" }}
                            fontFamily="Impact, sans-serif"
                            fontWeight={400}
                            width={100}
                            isEditing={editingField === 'score'}
                            setEditing={(v) => setEditingField(v ? 'score' : null)}
                            onChange={(val) => onDataChange({ score: val })}
                        />
                        <text x="0" y="55" textAnchor="middle" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="12" fill="#00FFF0">التقييم</text>
                    </g>

                    {/* Rank Info */}
                    <g transform="translate(220, 30)">
                        <path d="M 0,10 L 30,0 L 40,0" fill="none" stroke="#556070" strokeWidth="1" opacity="0.5"></path>
                        <text x="30" y="30" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="14" fill="#556070">التصنيف</text>
                        
                        <EditableText 
                            x={30} y={80} 
                            text={data.rank} 
                            fontSize={45} 
                            align="end" 
                            style={{ fill: "#FFFFFF", fontStyle: "italic" }}
                            fontFamily="Arial, sans-serif"
                            fontWeight={900}
                            width={140}
                            isEditing={editingField === 'rank'}
                            setEditing={(v) => setEditingField(v ? 'rank' : null)}
                            onChange={(val) => onDataChange({ rank: val })}
                        />
                        
                        <g transform="translate(30, 120)">
                            <rect x="0" y="0" width="2" height="40" fill="#556070"></rect>
                            <text x="-15" y="15" textAnchor="end" fontFamily="monospace" fontSize="12" fill="#556070">:الحالة</text>
                            <EditableText 
                                x={-15} y={35} 
                                text={data.status} 
                                fontSize={18} 
                                align="end" 
                                style={{ fill: "#00FFF0" }}
                                width={120}
                                isEditing={editingField === 'status'}
                                setEditing={(v) => setEditingField(v ? 'status' : null)}
                                onChange={(val) => onDataChange({ status: val })}
                            />
                        </g>
                    </g>
                </g>

                {/* 2. DYNAMIC SUMMARY (VERDICT) - Moved up to 320 */}
                <g transform={`translate(580, ${startY_Verdict})`}>
                    <rect x="456" y="10" width="4" height={verdictHeight} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
                    <text x="445" y="15" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#00FFF0">الملخص</text>
                    
                    {/* SVG Text (Hidden when editing) */}
                    {editingField !== 'verdict' && (
                        <g onClick={(e) => { e.stopPropagation(); setEditingField('verdict'); }} style={{ cursor: 'text' }}>
                            <DynamicTextBlock 
                                lines={verdictLines} 
                                x={445} y={45} 
                                lineHeight={verdictLineHeight} 
                                fontSize={verdictFontSize} 
                                align="end" 
                                color="#A0AEC0"
                            />
                        </g>
                    )}

                    {/* Textarea (Visible when editing) */}
                    {editingField === 'verdict' && (
                        <g transform="translate(20, 20)">
                            <foreignObject x="0" y="0" width="420" height={verdictHeight + 50}>
                                <textarea
                                    value={data.verdict}
                                    onChange={(e) => onDataChange({ verdict: e.target.value })}
                                    onBlur={() => setEditingField(null)}
                                    autoFocus
                                    style={{
                                        width: '100%', height: '100%',
                                        background: 'transparent',
                                        border: 'none', outline: 'none', resize: 'none',
                                        color: '#fff',
                                        fontSize: `${verdictFontSize}px`,
                                        lineHeight: `${verdictLineHeight}px`,
                                        fontWeight: '600',
                                        textAlign: 'right',
                                        direction: 'rtl',
                                        fontFamily: "'Cairo', sans-serif",
                                        padding: 0,
                                        overflow: 'hidden'
                                    }}
                                />
                            </foreignObject>
                        </g>
                    )}
                </g>

                {/* 3. DYNAMIC PROS & CONS */}
                
                {/* PROS */}
                <g transform={`translate(580, ${startY_Pros})`}>
                    <text x="460" y="0" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#00FFF0">الإيجابيات</text>
                    {prosLayout.map((item, index) => (
                        <g key={index} transform={`translate(0, ${item.y + 20})`}>
                            {/* Pro Item Background */}
                            <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-proGradient)"></path>
                            {/* Pro Item Accent Line */}
                            <rect x="457" y="0" width="3" height={item.height} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
                            
                            {/* Display Text */}
                            {editingField !== `pro-${index}` && (
                                <g onClick={(e) => { e.stopPropagation(); setEditingField(`pro-${index}`); }} style={{ cursor: 'text' }}>
                                    <DynamicTextBlock 
                                        lines={item.lines} 
                                        x={445} y={23} 
                                        lineHeight={prosConsLineHeight} 
                                        fontSize={16} 
                                        align="end" 
                                        color="#FFFFFF" 
                                        firstWordColor="#00FFF0"
                                    />
                                </g>
                            )}
                            
                            {/* Editing Input */}
                            {editingField === `pro-${index}` && (
                                <foreignObject x="0" y="0" width={445} height={item.height}>
                                    <textarea
                                        value={data.pros[index]}
                                        onChange={(e) => {
                                            const newPros = [...data.pros];
                                            newPros[index] = e.target.value;
                                            onDataChange({ pros: newPros });
                                        }}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        style={{
                                            width: '100%', height: '100%',
                                            background: 'transparent',
                                            border: 'none', outline: 'none', resize: 'none',
                                            color: '#fff',
                                            caretColor: '#00FFF0',
                                            fontSize: `${prosConsFontSize}px`,
                                            lineHeight: `${prosConsLineHeight}px`,
                                            fontWeight: '700',
                                            textAlign: 'right',
                                            direction: 'rtl',
                                            fontFamily: "'Cairo', sans-serif",
                                            padding: '2px 0 0 0',
                                            overflow: 'hidden'
                                        }}
                                    />
                                </foreignObject>
                            )}
                        </g>
                    ))}
                </g>

                {/* CONS */}
                <g transform={`translate(580, ${startY_Cons})`}>
                    <text x="460" y="0" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#FF0055">السلبيات</text>
                     {consLayout.map((item, index) => (
                        <g key={index} transform={`translate(0, ${item.y + 20})`}>
                            <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-conGradient)"></path>
                            <rect x="457" y="0" width="3" height={item.height} fill="#FF0055" filter="url(#review-redGlow)"></rect>
                            
                            {/* Display Text */}
                            {editingField !== `con-${index}` && (
                                <g onClick={(e) => { e.stopPropagation(); setEditingField(`con-${index}`); }} style={{ cursor: 'text' }}>
                                    <DynamicTextBlock 
                                        lines={item.lines} 
                                        x={445} y={23} 
                                        lineHeight={prosConsLineHeight} 
                                        fontSize={16} 
                                        align="end" 
                                        color="#FFFFFF" 
                                        firstWordColor="#FF0055"
                                    />
                                </g>
                            )}

                            {/* Editing Input */}
                            {editingField === `con-${index}` && (
                                <foreignObject x="0" y="0" width={445} height={item.height}>
                                    <textarea
                                        value={data.cons[index]}
                                        onChange={(e) => {
                                            const newCons = [...data.cons];
                                            newCons[index] = e.target.value;
                                            onDataChange({ cons: newCons });
                                        }}
                                        onBlur={() => setEditingField(null)}
                                        autoFocus
                                        style={{
                                            width: '100%', height: '100%',
                                            background: 'transparent',
                                            border: 'none', outline: 'none', resize: 'none',
                                            color: '#fff',
                                            caretColor: '#FF0055',
                                            fontSize: `${prosConsFontSize}px`,
                                            lineHeight: `${prosConsLineHeight}px`,
                                            fontWeight: '700',
                                            textAlign: 'right',
                                            direction: 'rtl',
                                            fontFamily: "'Cairo', sans-serif",
                                            padding: '2px 0 0 0',
                                            overflow: 'hidden'
                                        }}
                                    />
                                </foreignObject>
                            )}
                        </g>
                    ))}
                </g>

                {/* 4. FOOTER: PLATFORMS - Moved down to 1250 */}
                <g transform="translate(580, 1250)">
                    <path d="M 0,0 L 460,0 L 460,90 L 440,110 L 20,110 L 0,90 Z" fill="#0B0D12" stroke="#556070" strokeWidth="1"></path>
                    <rect x="30" y="45" width="400" height="2" fill="#1A202C"></rect>
                    
                    <g transform="translate(430, -15)">
                         <path d="M 0,0 L -150,0 L -160,10 L 0,10 Z" fill="#151820" stroke="#556070" strokeWidth="0.5"></path>
                         <text x="-10" y="7" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="700" fontSize="10" fill="#00FFF0">المنصات المدعومة</text>
                    </g>

                    {/* Platforms */}
                    {[
                        { key: 'PC', label: 'PC', x: 30 },
                        { key: 'PS5', label: 'PS5', x: 130 },
                        { key: 'XSX', label: 'XSX', x: 230 },
                        { key: 'NSW', label: 'NSW', x: 330 }
                    ].map((p) => {
                        const active = data.platforms[p.key as keyof typeof data.platforms];
                        return (
                            <g key={p.key} transform={`translate(${p.x}, 25)`} onClick={() => handlePlatformToggle(p.key as keyof typeof data.platforms)} style={{ cursor: 'pointer' }}>
                                <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z" fill={active ? "url(#review-activeModule)" : "url(#review-inactiveModule)"} stroke={active ? "#00FFF0" : "#556070"} strokeWidth="1" strokeDasharray={active ? "0" : "2 3"}></path>
                                {active && <path d="M 0,0 L 70,0 L 80,10 L 80,50 L 10,50 L 0,40 Z" fill="url(#review-hexTech)" clipPath="url(#review-moduleClip)"></path>}
                                <text x="40" y="30" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill={active ? "#FFFFFF" : "#556070"}>{p.label}</text>
                            </g>
                        )
                    })}

                    {/* Specs */}
                    <g transform="translate(30, 95)">
                        <rect x="-10" y="-8" width="420" height="20" fill="#151820" rx="2" stroke="#556070" strokeWidth="0.5"></rect>
                        <g transform="translate(20, 5)">
                             <EditableText x={10} y={0} text={data.techSpecs.res} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techRes'} setEditing={(v) => setEditingField(v ? 'techRes' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, res: val } })} width={100} />
                        </g>
                        <g transform="translate(130, 5)">
                            <EditableText x={10} y={0} text={data.techSpecs.fps} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techFps'} setEditing={(v) => setEditingField(v ? 'techFps' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, fps: val } })} width={100} />
                        </g>
                         <g transform="translate(260, 5)">
                            <EditableText x={10} y={0} text={data.techSpecs.hdr} fontSize={12} align="start" style={{ fill: "#AAA", fontFamily: "monospace" }} isEditing={editingField === 'techHdr'} setEditing={(v) => setEditingField(v ? 'techHdr' : null)} onChange={(val) => onDataChange({ techSpecs: { ...data.techSpecs, hdr: val } })} width={100} />
                        </g>
                    </g>
                </g>

                <g stroke="#556070" strokeWidth="1">
                    <line x1="500" y1="440" x2="580" y2="440"></line> <rect x="520" y="435" width="10" height="10" fill="#00FFF0"></rect>
                    <line x1="500" y1="900" x2="580" y2="900"></line> <rect x="550" y="895" width="10" height="10" fill="#00FFF0"></rect>
                </g>

                <rect width="100%" height="100%" filter="url(#review-grain)" opacity="0.08" pointerEvents="none" style={{ mixBlendMode: 'overlay' }}></rect>

            </svg>
        </div>
    );
}