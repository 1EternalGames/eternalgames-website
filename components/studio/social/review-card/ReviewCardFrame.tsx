// components/studio/social/review-card/ReviewCardFrame.tsx
import React from 'react';

export default function ReviewCardFrame({ enChar }: { enChar: string }) {
    const cyanFramePath = "M 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350";
    const framePathD = "M 0,0 L 500,0 L 540,40 L 540,400 L 500,440 L 500,900 L 540,940 L 540,1310 L 500,1350 L 0,1350";

    return (
        <>
            {/* Removed the black background rect and hex grid, now handled by SpaceBackground in parent */}
            
            <text x="810" y="700" textAnchor="middle" fontFamily="'Impact', sans-serif" fontWeight="900" fontSize="600" fill="#10121A" opacity="0.5">
                {enChar || 'R'}
            </text>

            <path 
                d={framePathD} 
                fill="none" 
                stroke="#00FFF0" 
                strokeWidth="4" 
                filter="url(#review-cyanGlow)"
                pointerEvents="none"
            />
            
            <path 
                d={cyanFramePath} 
                stroke="#00FFF0" 
                strokeWidth="4" 
                fill="none" 
                filter="drop-shadow(0 0 15px #00FFF0)"
                pointerEvents="none"
            />
            
            <g stroke="#556070" strokeWidth="1">
                <line x1="500" y1="440" x2="580" y2="440"></line> <rect x="520" y="435" width="10" height="10" fill="#00FFF0"></rect>
                <line x1="500" y1="900" x2="580" y2="900"></line> <rect x="550" y="895" width="10" height="10" fill="#00FFF0"></rect>
            </g>

            <rect width="100%" height="100%" filter="url(#review-grain)" opacity="0.08" pointerEvents="none" style={{ mixBlendMode: 'overlay' }}></rect>
        </>
    );
}


