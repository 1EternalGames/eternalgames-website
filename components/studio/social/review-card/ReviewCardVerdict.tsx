// components/studio/social/review-card/ReviewCardVerdict.tsx
'use client';

import React, { useMemo } from 'react';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
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
    const verdictLineHeight = 30; // px
    const verdictWidth = 450;
    
    const verdictLines = useMemo(() => calculateWrappedLines(data.verdict, verdictFontSize, verdictWidth, 600), [data.verdict]);
    const verdictHeight = verdictLines.length * verdictLineHeight;
    // Lifted from 320 to 290
    const startY_Verdict = 205;

    return (
        <g transform={`translate(580, ${startY_Verdict})`}>
            <rect x="456" y="0" width="4" height={verdictHeight} fill="#00FFF0" filter="url(#review-cyanGlow)"></rect>
            <text x="445" y="-10" textAnchor="end" fontFamily="'Dystopian', 'Cairo', sans-serif" fontWeight="900" fontSize="22" fill="#00FFF0">الملخص</text>
            
            <foreignObject x="-5" y="0" width={verdictWidth} height={verdictHeight + 50}>
                <SocialNewsBodyEditor
                    content={data.verdict}
                    onChange={(html) => onDataChange({ verdict: html })}
                    fontSize={verdictFontSize}
                    isEditing={editingField === 'verdict'}
                    setEditing={(val) => setEditingField(val ? 'verdict' : null)}
                    textAlign="justify"
                    customStyle={{
                        lineHeight: `${verdictLineHeight}px`,
                        color: '#A0AEC0',
                        fontWeight: 700,
                        fontFamily: "'Dystopian', 'Cairo', sans-serif"
                    }}
                />
            </foreignObject>
        </g>
    );
}