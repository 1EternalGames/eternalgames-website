// components/studio/social/weekly-news/types.ts

export interface ImageSettings {
    x: number;
    y: number;
    scale: number;
}

export interface WeeklyHeroData {
    tag: string;
    title: string; // Combined Title + Subtitle
    image: string;
    imageSettings: ImageSettings;
}

export interface WeeklyCardData {
    id: number;
    title: string; // Combined Title + Subtitle
    image: string;
    imageSettings: ImageSettings;
}

export interface WeeklyListItem {
    id: number;
    number: string;
    text: string;
}

export interface WeeklyNewsTemplateData {
    weekNumber: string;
    year: string;
    hero: WeeklyHeroData;
    cards: WeeklyCardData[];
    newsList: WeeklyListItem[];
}