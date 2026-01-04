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

// Colors: Official (Cyan), Rumor (Gold), Leak (Red)
const TYPE_COLORS: Record<string, string> = {
    official: '#00FFF0', 
    rumor: '#FFD700',    
    leak: '#FF3333'      
};

export default function WeeklyNewsList({ data, onChange }: Props) {
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleItemChange = (index: number, field: 'number' | 'text', value: string) => {
        const newList = [...data.newsList];
        newList[index] = { ...newList[index], [field]: value };
        onChange({ newsList: newList });
    };
    
    // Cycle through types: Official -> Rumor -> Leak -> Official
    const toggleItemType = (index: number) => {
        const newList = [...data.newsList];
        const types = ['official', 'rumor', 'leak'] as const;
        const currentTypeIndex = types.indexOf(newList[index].type || 'official');
        newList[index].type = types[(currentTypeIndex + 1) % types.length];
        onChange({ newsList: newList });
    };

    const renderColumn = (startIndex: number, xOffset: number) => {
        const items = data.newsList.slice(startIndex, startIndex + 6);
        return (
            <g transform={`translate(${xOffset}, 70)`}>
                {items.map((item, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    const yPos = localIndex * 75;
                    
                    const isImportant = !!item.isImportant;
                    const typeColor = TYPE_COLORS[item.type || 'official'];
                    const numberColor = isImportant ? typeColor : "#556070";

                    return (
                        <g key={item.id} transform={`translate(0, ${yPos})`}>
                            {/* Vertical Line Marker (Important Only) */}
                            {isImportant && (
                                <rect 
                                    x="456" y="0" width="4" height="20" fill={typeColor} 
                                    onClick={(e) => { e.stopPropagation(); toggleItemType(globalIndex); }}
                                    style={{ cursor: 'pointer' }}
                                />
                            )}
                            
                            {/* Number Text */}
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
                            
                            {/* INTERACTIVE OVERLAY: Placed AFTER EditableText to capture clicks on top of it */}
                            <rect 
                                x={375} y={0} width={60} height={30} 
                                fill="transparent" 
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    toggleItemType(globalIndex); 
                                }}
                            />
                            
                            {/* Text Body */}
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
                                        lineHeight: 1.4,
                                        fontFamily: "'Dystopian', 'Cairo', sans-serif"
                                    }}
                                    enableFirstWordColor={true}
                                    firstWordColor={typeColor}
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
        <g transform="translate(40, 700)">
             {/* Header (Title) */}
             <g transform="translate(0, 5)">
                <rect x="0" y="-15" width="1000" height="1" fill="#333"></rect>
                <rect x="800" y="-17" width="200" height="4" fill="#00FFF0" filter="url(#wn-neonGlow)"></rect>
                <text x="1000" y="30" direction="rtl" textAnchor="start" fontWeight="900" fontSize="28" fill="#FFF" fontFamily="'Dystopian', 'Cairo', sans-serif">بقية الأخبار</text>
            </g>

            {/* Content Group (Shifted down to avoid overlap) */}
            <g transform="translate(0, 35)">
                {/* CUT CORNER BACKGROUND */}
                <path 
                    d="M 0,60 L 20,40 L 980,40 L 1000,60 L 1000,500 L 980,520 L 20,520 L 0,500 Z" 
                    fill="#0B0D12" 
                    stroke="#1A202C" 
                    strokeWidth="1"
                />
                
                {/* CORNER ACCENTS */}
                <path d="M 0,80 L 0,60 L 20,40 L 40,40" fill="none" stroke="#00FFF0" strokeWidth="2" filter="url(#wn-neonGlow)" />
                <path d="M 960,40 L 980,40 L 1000,60 L 1000,80" fill="none" stroke="#00FFF0" strokeWidth="2" filter="url(#wn-neonGlow)" />
                <path d="M 1000,480 L 1000,500 L 980,520 L 960,520" fill="none" stroke="#00FFF0" strokeWidth="2" filter="url(#wn-neonGlow)" />
                <path d="M 40,520 L 20,520 L 0,500 L 0,480" fill="none" stroke="#00FFF0" strokeWidth="2" filter="url(#wn-neonGlow)" />

                {renderColumn(0, 520)}
                {renderColumn(6, 20)}
            </g>
        </g>
    );
}