// app/studio/social-templates/weekly-news/actions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

export interface WeeklyNewsItem {
    _id: string;
    title: string;
    publishedAt: string;
    imageUrl: string;
    category?: string;
}

export interface WeekOption {
    label: string;
    weekNum: number;
    year: number;
    startDate: string;
    endDate: string;
}

export async function getRecentWeeksAction(): Promise<WeekOption[]> {
    const weeks: WeekOption[] = [];
    const today = new Date();
    
    // Go back 12 weeks
    for (let i = 0; i < 12; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (i * 7));
        
        // Calculate Week Number (ISO)
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        
        // Calculate Start/End of that week (assuming Sunday start for visual convenience or Monday)
        // Let's use Monday start for standard ISO
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(d.setDate(diff + 6));

        weeks.push({
            label: `الأسبوع ${weekNum} (${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`,
            weekNum,
            year: monday.getFullYear(),
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0]
        });
    }
    return weeks;
}

export async function getNewsForWeekAction(startDate: string, endDate: string): Promise<WeeklyNewsItem[]> {
    const query = groq`
        *[_type == "news" && publishedAt >= $startDate && publishedAt <= $endDate] | order(publishedAt desc) {
            _id,
            title,
            publishedAt,
            "imageUrl": mainImage.asset->url,
            "category": category->title
        }
    `;

    try {
        // End date needs to cover the full day, so we might want to extend it or rely on date comparison
        // Sanity date comparison is string based for ISO. 
        // We'll pass the raw YYYY-MM-DD.
        const results = await client.fetch(query, { startDate, endDate });
        return results;
    } catch (error) {
        console.error("Failed to fetch weekly news:", error);
        return [];
    }
}