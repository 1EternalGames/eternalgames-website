// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedNewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';

// Revalidate frequently, but not too frequently for a high-traffic endpoint
export const revalidate = 300; // 5 minutes

// Cache function for the paginated results based on query parameters
const getCachedPaginatedNews = unstable_cache(
    async (
        gameSlug: string | undefined, 
        tagSlugs: string[] | undefined, 
        searchTerm: string | undefined, 
        offset: number, 
        limit: number,
        sort: 'latest' | 'viral'
    ) => {
        const tags = tagSlugs?.length === 0 ? undefined : tagSlugs;
        // FIX: Correctly call the query builder, passing `undefined` for the unused `category` parameter.
        const query = paginatedNewsQuery(gameSlug, tags, searchTerm, undefined, offset, limit, sort);
        // FIX: Removed redundant parameters from fetch call as they are interpolated into the query string.
        const sanityData = await client.fetch(query);
        const data = sanityData.map(adaptToCardProps).filter(Boolean);
        return data;
    },
    ['paginated-news'],
    { revalidate: 300, tags: ['news', 'paginated'] }
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');
        const gameSlug = searchParams.get('game') || undefined;
        const searchTerm = searchParams.get('q') || undefined;
        const tagSlugsString = searchParams.get('tags');
        const tagSlugs = tagSlugsString ? tagSlugsString.split(',') : undefined;
        // FIX: Correctly parse the `sort` parameter from the URL.
        const sort = (searchParams.get('sort') as 'latest' | 'viral') || 'latest';
        
        const data = await getCachedPaginatedNews(
            gameSlug, 
            tagSlugs, 
            searchTerm, 
            offset, 
            limit,
            sort // FIX: Pass the sort parameter to the cached function.
        );

        return NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

    } catch (error) {
        console.error('Error fetching paginated news:', error);
        return NextResponse.json({ error: 'Failed to fetch news data' }, { status: 500 });
    }
}