// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedNewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';
import { enrichContentList } from '@/lib/enrichment'; // <-- ADDED

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
        const query = paginatedNewsQuery(gameSlug, tags, searchTerm, offset, limit, sort);
        const sanityData = await client.fetch(query);
        // THE FIX: Enrich data inside the cache function
        const enrichedData = await enrichContentList(sanityData);
        const data = enrichedData.map(adaptToCardProps).filter(Boolean);
        return data;
    },
    ['paginated-news'],
    { tags: ['news'] }
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        const offset = parseInt(searchParams.get('offset') || '50');
        const limit = parseInt(searchParams.get('limit') || '50');
        const gameSlug = searchParams.get('game') || undefined;
        const searchTerm = searchParams.get('q') || undefined;
        const tagSlugsString = searchParams.get('tags');
        const tagSlugs = tagSlugsString ? tagSlugsString.split(',') : undefined;
        const sort = (searchParams.get('sort') as 'latest' | 'viral') || 'latest';
        
        const data = await getCachedPaginatedNews(
            gameSlug, 
            tagSlugs, 
            searchTerm, 
            offset, 
            limit,
            sort
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