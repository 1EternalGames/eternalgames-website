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
        Cloud: boolean;
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
}

export interface MonthlyGamesCanvasProps {
    data: MonthlyGamesTemplateData;
    onDataChange: (newData: Partial<MonthlyGamesTemplateData>) => void;
    scale?: number;
}


