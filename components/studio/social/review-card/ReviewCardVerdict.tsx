// components/studio/social/review-card/ReviewCardVerdict.tsx
'use client';

import React, { useMemo } from 'react';
import JustifiedTextBlock from '../shared/JustifiedTextBlock';
import { ReviewTemplateData } from './types';
import { calculateWrappedLines } from '../shared/canvas-utils';

interface ReviewCardVerdictProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardVerdict({ data, onDataChange, editingField, setEditingField }: ReviewCardVerdictProps) {
    const verdictFontSize = 20;
    const verdictLineHeight = 35;
    const verdictWidth = 420;
    
    const verdictLines = useMemo(() => calculateWrappedLines(data.verdict, verdictFontSize, verdictWidth, 600), [data.verdict]);
    const verdictHeight = verdictLines.length * verdictLineHeight;
    const startY_Verdict = 320;

    return (
        <g transform={`translate(580, ${startY_Verdict})`}>
            <rect x="456" y="10" width="4" height={verdictHeight} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
            <text x="445" y="15" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#00FFF0">الملخص</text>
            
            {/* SVG/HTML Justified Text (Hidden when editing) */}
            {editingField !== 'verdict' && (
                <g onClick={(e) => { e.stopPropagation(); setEditingField('verdict'); }} style={{ cursor: 'text' }}>
                    <JustifiedTextBlock 
                        text={data.verdict}
                        x={20} y={30} 
                        width={420} 
                        height={verdictHeight + 50} 
                        fontSize={verdictFontSize}
                        lineHeight={verdictLineHeight}
                        color="#A0AEC0"
                    />
                </g>
            )}

            {/* Textarea (Visible when editing) */}
            {editingField === 'verdict' && (
                <foreignObject x="20" y="30" width={420} height={verdictHeight + 50}>
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
                            fontWeight: '700',
                            textAlign: 'justify', // Justify while editing too
                            textAlignLast: 'right',
                            direction: 'rtl',
                            fontFamily: "'Cairo', sans-serif",
                            padding: 0,
                            overflow: 'hidden'
                        }}
                    />
                </foreignObject>
            )}
        </g>
    );
}