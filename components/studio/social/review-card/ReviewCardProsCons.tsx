// components/studio/social/review-card/ReviewCardProsCons.tsx
'use client';

import React, { useMemo } from 'react';
import JustifiedTextBlock from '../shared/JustifiedTextBlock';
import { ReviewTemplateData } from './types';
import { calculateWrappedLines } from '../shared/canvas-utils';

interface ReviewCardProsConsProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
}

export default function ReviewCardProsCons({ data, onDataChange, editingField, setEditingField }: ReviewCardProsConsProps) {
    const prosConsFontSize = 18;
    const prosConsLineHeight = 32;
    const prosConsWidth = 445; 
    
    // Recalculate layout to determine startY positions
    const verdictFontSize = 20;
    const verdictWidth = 420;
    const verdictLines = useMemo(() => calculateWrappedLines(data.verdict, verdictFontSize, verdictWidth, 600), [data.verdict]);
    const verdictHeight = verdictLines.length * 35; // 35 is verdictLineHeight

    const GAP = 100;
    const startY_Verdict = 320;
    const startY_Pros = startY_Verdict + verdictHeight + GAP; 

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
    const startY_Cons = startY_Pros + totalProsHeight + GAP;

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

    return (
        <>
            {/* PROS */}
            <g transform={`translate(580, ${startY_Pros})`}>
                <text x="460" y="0" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#00FFF0">الإيجابيات</text>
                {prosLayout.map((item, index) => (
                    <g key={index} transform={`translate(0, ${item.y + 20})`}>
                        <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-proGradient)"></path>
                        <rect x="457" y="0" width="3" height={item.height} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
                        
                        {editingField !== `pro-${index}` && (
                            <g onClick={(e) => { e.stopPropagation(); setEditingField(`pro-${index}`); }} style={{ cursor: 'text' }}>
                                <JustifiedTextBlock 
                                    text={data.pros[index]}
                                    x={0} y={10} 
                                    width={445} 
                                    height={item.height} 
                                    fontSize={16} 
                                    lineHeight={prosConsLineHeight}
                                    color="#FFFFFF"
                                    firstWordColor="#00FFF0"
                                />
                            </g>
                        )}
                        
                        {editingField === `pro-${index}` && (
                            <foreignObject x="0" y="10" width={445} height={item.height}>
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
                                        textAlign: 'justify',
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
                ))}
            </g>

            {/* CONS */}
            <g transform={`translate(580, ${startY_Cons})`}>
                <text x="460" y="0" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#FF0055">السلبيات</text>
                    {consLayout.map((item, index) => (
                    <g key={index} transform={`translate(0, ${item.y + 20})`}>
                        <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-conGradient)"></path>
                        <rect x="457" y="0" width="3" height={item.height} fill="#FF0055" filter="url(#review-redGlow)"></rect>
                        
                        {editingField !== `con-${index}` && (
                            <g onClick={(e) => { e.stopPropagation(); setEditingField(`con-${index}`); }} style={{ cursor: 'text' }}>
                                <JustifiedTextBlock 
                                    text={data.cons[index]}
                                    x={0} y={10} 
                                    width={445} 
                                    height={item.height} 
                                    fontSize={16} 
                                    lineHeight={prosConsLineHeight}
                                    color="#FFFFFF"
                                    firstWordColor="#FF0055"
                                />
                            </g>
                        )}

                        {editingField === `con-${index}` && (
                            <foreignObject x="0" y="10" width={445} height={item.height}>
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
                                        textAlign: 'justify',
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
                ))}
            </g>
        </>
    );
}