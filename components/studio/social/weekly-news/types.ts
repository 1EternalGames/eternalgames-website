// components/studio/social/weekly-news/types.ts

export type NewsType = 'official' | 'rumor' | 'leak';

export interface ImageSettings {
    x: number;
    y: number;
    scale: number;
}

export interface BadgeState {
    type: NewsType;
    xbox: boolean;
    playstation: boolean;
    nintendo: boolean;
    pc: boolean;
}

export interface WeeklyHeroData {
    sourceId?: string; // NEW
    tag: string;
    title: string;
    image: string;
    imageSettings: ImageSettings;
    badges: BadgeState;
}

export interface WeeklyCardData {
    sourceId?: string; // NEW
    id: number;
    title: string;
    image: string;
    imageSettings: ImageSettings;
    badges: BadgeState;
}

export interface WeeklyListItem {
    sourceId?: string; // NEW
    id: number;
    number: string;
    text: string;
    type: NewsType;
    isImportant: boolean;
}

export interface WeeklyNewsTemplateData {
    weekNumber: string;
    year: string;
    hero: WeeklyHeroData;
    cards: WeeklyCardData[];
    newsList: WeeklyListItem[];
}


