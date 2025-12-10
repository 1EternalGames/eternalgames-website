// components/studio/social/weekly-news/types.ts

export interface ImageSettings {
    x: number;
    y: number;
    scale: number;
}

export interface WeeklyHeroData {
    tag: string;
    title: string;
    subtitle: string;
    image: string;
    imageSettings: ImageSettings;
}

export interface WeeklyCardData {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    imageSettings: ImageSettings;
}

export interface WeeklyListItem {
    id: number;
    number: string; // "05", "06", etc.
    text: string; // Rich text content
}

export interface WeeklyNewsTemplateData {
    weekNumber: string;
    year: string;
    hero: WeeklyHeroData;
    cards: WeeklyCardData[]; // Always length 3
    newsList: WeeklyListItem[]; // Length 10 (split into 2 cols of 5)
}