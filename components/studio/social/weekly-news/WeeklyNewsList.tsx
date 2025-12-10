// components/studio/social/weekly-news/WeeklyNewsList.tsx
'use client';

import React, { useState } from 'react';
import { WeeklyNewsTemplateData } from './types';
import SocialNewsBodyEditor from '../SocialNewsBodyEditor';
import EditableText from '../shared/EditableText';

interface Props {
    data: WeeklyNewsTemplateData;
    onChange: (newData: Partial<WeeklyNewsTemplateData>) => void;
}

export default function WeeklyNewsList({ data, onChange }: Props) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleItemChange = (index: number, field: 'number' | 'text', value: string) => {
        const newList = [...data.newsList];
        newList[index] = { ...newList[index], [field]: value };
        onChange({ newsList: newList });
    };

    const renderColumn = (startIndex: number, xOffset: number) => {
        const items = data.newsList.slice(startIndex, startIndex + 5);
        return (
            <g transform={`translate(${xOffset}, 70)`}>
                {items.map((item, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    const yPos = localIndex * 85;
                    const isCyan = [0, 2].includes(localIndex);
                    const numberColor = isCyan ? "#00FFF0" : "#556070";

                    return (
                        <g key={item.id} transform={`translate(0, ${yPos})`}>
                            {/* Vertical Line Marker */}
                            {isCyan && <rect x="456" y="0" width="4" height="20" fill={numberColor} />}
                            
                            {/* Number: Moved Left (x=425) to create gap from line at x=456 */}
                            <EditableText
                                x={425} y={16}
                                text={item.number}
                                fontSize={16}
                                align="end"
                                style={{ fill: numberColor, fontFamily: "monospace", fontWeight: 700 }}
                                onChange={(val) => handleItemChange(globalIndex, 'number', val)}
                                isEditing={editingField === `num-${globalIndex}`}
                                setEditing={(v) => setEditingField(v ? `num-${globalIndex}` : null)}
                                width={50}
                                inputStyle={{fontFamily: 'monospace'}}
                            />
                            
                            {/* Text Body: Lowered y from -5 to 0 to align center with number */}
                            <foreignObject x={0} y={0} width={410} height={60}>
                                <SocialNewsBodyEditor
                                    content={item.text}
                                    onChange={(val) => handleItemChange(globalIndex, 'text', val)}
                                    fontSize={14}
                                    textAlign="right"
                                    isEditing={editingField === `text-${globalIndex}`}
                                    setEditing={(v) => setEditingField(v ? `text-${globalIndex}` : null)}
                                    customStyle={{
                                        color: "#FFFFFF",
                                        fontWeight: 700,
                                        lineHeight: 1.4
                                    }}
                                    // FIRST WORD CYAN ONLY
                                    enableFirstWordCyan={true}
                                    // NO RANDOM ENGLISH COLORS
                                    disableAutoEnglish={true}
                                />
                            </foreignObject>
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <g transform="translate(40, 660)">
             <g transform="translate(0, 5)">
                <rect x="0" y="-15" width="1000" height="1" fill="#333"></rect>
                <rect x="800" y="-17" width="200" height="4" fill="#00FFF0" filter="url(#wn-neonGlow)"></rect>
                <text x="1000" y="30" direction="rtl" textAnchor="start" fontWeight="900" fontSize="28" fill="#FFF">بقية الأخبار</text>
            </g>

            <rect x="0" y="40" width="1000" height="480" fill="#0B0D12" rx="4" stroke="#1A202C" strokeWidth="1"></rect>

            {renderColumn(0, 520)}
            {renderColumn(5, 20)}
        </g>
    );
}