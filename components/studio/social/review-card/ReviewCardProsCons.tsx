// components/studio/social/review-card/ReviewCardProsCons.tsx
'use client';

import React, { useMemo } from 'react';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
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
    const prosConsWidth = 455; 
    
    // Recalculate layout to determine startY positions
    const verdictFontSize = 20;
    const verdictWidth = 420;
    const verdictLines = useMemo(() => calculateWrappedLines(data.verdict, verdictFontSize, verdictWidth, 600), [data.verdict]);
    const verdictHeight = verdictLines.length * 35;

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
                <text x="460" y="-10" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#00FFF0">الإيجابيات</text>
                {prosLayout.map((item, index) => (
                    <g key={`pro-${index}`} transform={`translate(0, ${item.y})`}>
                        <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-proGradient)"></path>
                        <rect x="457" y="0" width="3" height={item.height} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
                        
                        <foreignObject x="0" y="0" width={prosConsWidth} height={item.height + 10}>
                             <SocialNewsBodyEditor
                                content={data.pros[index]}
                                onChange={(html) => {
                                    const newPros = [...data.pros];
                                    newPros[index] = html;
                                    onDataChange({ pros: newPros });
                                }}
                                fontSize={prosConsFontSize}
                                isEditing={editingField === `pro-${index}`}
                                setEditing={(val) => setEditingField(val ? `pro-${index}` : null)}
                                textAlign="justify"
                                customStyle={{
                                    lineHeight: `${prosConsLineHeight}px`,
                                    color: '#FFFFFF',
                                    paddingTop: '2px'
                                }}
                            />
                        </foreignObject>
                    </g>
                ))}
            </g>

            {/* CONS */}
            <g transform={`translate(580, ${startY_Cons})`}>
                <text x="460" y="-10" textAnchor="end" fontFamily="'Cairo', sans-serif" fontWeight="900" fontSize="16" fill="#FF0055">السلبيات</text>
                {consLayout.map((item, index) => (
                    <g key={`con-${index}`} transform={`translate(0, ${item.y})`}>
                        <path d={`M 0,0 L 450,0 L 460,10 L 460,${item.height} L 0,${item.height} Z`} fill="url(#review-conGradient)"></path>
                        <rect x="457" y="0" width="3" height={item.height} fill="#FF0055" filter="url(#review-redGlow)"></rect>
                        
                        <foreignObject x="0" y="0" width={prosConsWidth} height={item.height + 10}>
                             <SocialNewsBodyEditor
                                content={data.cons[index]}
                                onChange={(html) => {
                                    const newCons = [...data.cons];
                                    newCons[index] = html;
                                    onDataChange({ cons: newCons });
                                }}
                                fontSize={prosConsFontSize}
                                isEditing={editingField === `con-${index}`}
                                setEditing={(val) => setEditingField(val ? `con-${index}` : null)}
                                textAlign="justify"
                                customStyle={{
                                    lineHeight: `${prosConsLineHeight}px`,
                                    color: '#FFFFFF',
                                    paddingTop: '2px'
                                }}
                            />
                        </foreignObject>
                    </g>
                ))}
            </g>
        </>
    );
}