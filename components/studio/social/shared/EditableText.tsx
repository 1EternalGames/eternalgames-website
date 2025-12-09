// components/studio/social/review-card/EditableText.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function EditableText({ 
    x, y, text, fontSize, align, style, onChange, isEditing, setEditing, width = 400,
    fontFamily = "'Cairo', sans-serif", fontWeight = 700, lineHeight = 1.2
}: { 
    x: number, y: number, text: string, fontSize: number, align: 'start' | 'middle' | 'end', 
    style?: React.CSSProperties, onChange: (val: string) => void,
    isEditing: boolean, setEditing: (v: boolean) => void, width?: number,
    fontFamily?: string, fontWeight?: number, lineHeight?: number
}) {
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
}