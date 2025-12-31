// components/studio/social/monthly-games/types.ts

export interface GameSlotData {
    id: number;
    title: string;
    day: string;
    image: string;
    platforms: {
        PC: boolean;
        PS5: boolean;
        XSX: boolean;
        NSW: boolean;
    };
    badges: {
        gamePass: boolean;
        psPlus: boolean;
        exclusive: boolean;
        price: {
            active: boolean;
            text: string;
        };
    };
    imageSettings: { x: number; y: number; scale: number };
}

export interface MonthlyGamesTemplateData {
    month: string;
    slots: GameSlotData[];
    // NEW: Vibrance level (0-200, default 100)
    vibrance?: number;
}

export interface MonthlyGamesCanvasProps {
    data: MonthlyGamesTemplateData;
    onDataChange: (newData: Partial<MonthlyGamesTemplateData>) => void;
    scale?: number;
}