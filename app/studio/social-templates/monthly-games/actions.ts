// app/studio/social-templates/monthly-games/actions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

export interface SmartFillRelease {
    _id: string;
    title: string;
    releaseDate: string;
    platforms: string[];
    imageUrl: string;
    price?: string;
    onGamePass?: boolean;
    onPSPlus?: boolean;
}

export async function getReleasesForMonthAction(dateString: string): Promise<SmartFillRelease[]> {
    // dateString format "YYYY-MM"
    if (!dateString) return [];

    const [yearStr, monthStr] = dateString.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed

    // Calculate start and end dates for the query
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0)); // Last day of month

    const startIso = startDate.toISOString().split('T')[0];
    const endIso = endDate.toISOString().split('T')[0];

    const query = groq`
        *[_type == "gameRelease" && releaseDate >= $startIso && releaseDate <= $endIso] | order(releaseDate asc) {
            _id,
            title,
            releaseDate,
            platforms,
            // UPDATED: Prioritize vertical image, fallback to standard mainImage
            "imageUrl": coalesce(mainImageVertical.asset->url, mainImage.asset->url),
            price,
            "onGamePass": coalesce(onGamePass, false),
            "onPSPlus": coalesce(onPSPlus, false)
        }
    `;

    try {
        const results = await client.fetch(query, { startIso, endIso });
        return results;
    } catch (error) {
        console.error("Failed to fetch releases:", error);
        return [];
    }
}