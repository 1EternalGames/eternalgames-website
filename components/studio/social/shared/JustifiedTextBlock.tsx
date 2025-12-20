// components/studio/social/review-card/JustifiedTextBlock.tsx
'use client';

import React from 'react';

export default function JustifiedTextBlock({ 
    text, x, y, width, height, lineHeight, fontSize, color, firstWordColor, style 
}: { 
    text: string, x: number, y: number, width: number, height: number, lineHeight: number, fontSize: number, color: string, firstWordColor?: string, style?: React.CSSProperties
}) {
    const renderContent = () => {
        if (!firstWordColor) return text;
        const words = text.split(' ');
        const first = words[0];
        const rest = words.slice(1).join(' ');
        return (
            <>
                <span style={{ color: firstWordColor }}>{first}</span>{' '}{rest}
            </>
        );
    };

    return (
        <foreignObject x={x} y={y} width={width} height={height} style={{ pointerEvents: 'none' }}>
            <div style={{
                width: '100%',
                height: '100%',
                fontFamily: "'Cairo', sans-serif",
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                lineHeight: `${lineHeight}px`,
                color: color,
                textAlign: 'justify',
                textAlignLast: 'right', 
                direction: 'rtl',
                ...style
            }}>
                {renderContent()}
            </div>
        </foreignObject>
    );
}


