// components/studio/social/shared/EditableText.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function EditableText({ 
    x, y, text, fontSize, align, style, onChange, isEditing, setEditing, width = 400,
    fontFamily = "'Cairo', sans-serif", fontWeight = 700, lineHeight = 1.2,
    strokeWidth = 0, strokeColor = 'transparent', shadowStyle = {},
    inputStyle = {},
    inputDy = 0 // NEW: Vertical offset adjustment for the input field
}: { 
    x: number, y: number, text: string, fontSize: number, align: 'start' | 'middle' | 'end', 
    style?: React.CSSProperties, onChange: (val: string) => void,
    isEditing: boolean, setEditing: (v: boolean) => void, width?: number,
    fontFamily?: string, fontWeight?: number, lineHeight?: number,
    strokeWidth?: number, strokeColor?: string, shadowStyle?: React.CSSProperties,
    inputStyle?: React.CSSProperties,
    inputDy?: number
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    let foreignX = x;
    // Default text alignment logic (assuming RTL context primarily)
    // align='middle' -> center
    // align='start' -> right (for RTL)
    // align='end' -> left (for RTL)
    const textAlign = align === 'middle' ? 'center' : (align === 'start' ? 'right' : 'left'); 

    if (align === 'middle') foreignX = x - (width / 2);
    if (align === 'start') foreignX = x - width; 
    if (align === 'end') foreignX = x; 
    
    // Vertical centering adjustment with manual delta
    const foreignY = y - (fontSize * 1.15) + inputDy; 

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
                            fontWeight={fontWeight}
                            fontFamily={fontFamily}
                        >
                            {text}
                        </text>
                    )}
                    <text 
                        x={x} y={y} 
                        textAnchor={align} 
                        style={{ ...style, pointerEvents: 'none' }}
                        fontSize={fontSize}
                        fontWeight={fontWeight}
                        fontFamily={fontFamily}
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
                style={{ pointerEvents: (isEditing || isFocused) ? 'auto' : 'none' }}
            >
                {(isEditing || isFocused) && (
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
                        dir="auto"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: inputColor,
                            fontSize: `${fontSize}px`,
                            fontFamily: fontFamily,
                            fontWeight: fontWeight,
                            textAlign: textAlign,
                            padding: 0,
                            margin: 0,
                            caretColor: '#00FFF0',
                            textShadow: isFocused ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                            lineHeight: lineHeight,
                            direction: 'rtl',
                            ...inputStyle
                        }}
                    />
                )}
            </foreignObject>
        </g>
    );
}


