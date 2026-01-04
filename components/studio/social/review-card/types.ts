// components/studio/social/review-card/types.ts

export interface ReviewTemplateData {
    id: string;
    gameTitleAr: string;
    gameTitleEnTop: string;
    gameTitleEnBottom: string;
    score: string;
    rank: string;
    status: string;
    verdict: string;
    pros: string[];
    cons: string[];
    platforms: {
        PC: boolean;
        PS5: boolean;
        XSX: boolean;
        NSW: boolean;
    };
    techSpecs: {
        res: string;
        fps: string;
        hdr: string;
    };
    image: string;
    imageSettings: { x: number; y: number; scale: number };
    
    // VISUAL SETTINGS
    vibrance?: number; // 0-200
    tintStrength?: number; // 0-100 (Global Wash)
    creditsOpacity?: number; // 0-100 (New)
    
    // NEW: Movable Gradient Settings
    gradientSettings?: {
        active: boolean;
        x: number;
        y: number;
        opacity: number;
        scale: number;
    };
}

export interface ReviewCardCanvasProps {
    data: ReviewTemplateData;
    onDataChange: (newData: Partial<ReviewTemplateData>) => void;
    scale?: number;
    // New prop to control what is being dragged
    editMode?: 'image' | 'gradient'; 
}