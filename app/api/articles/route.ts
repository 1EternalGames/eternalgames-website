// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedArticlesQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';
import { enrichContentList } from '@/lib/enrichment';
import { standardLimiter } from '@/lib/rate-limit'; 

const getCachedPaginatedArticles = unstable_cache(
    async (
        gameSlug: string | undefined, 
        tagSlugs: string[] | undefined, 
        searchTerm: string | undefined, 
        offset: number, 
        limit: number,
        sort: 'latest' | 'viral'
    ) => {
        const query = paginatedArticlesQuery(gameSlug, tagSlugs, searchTerm, offset, limit, sort);
        const sanityData = await client.fetch(query);
        const enrichedData = await enrichContentList(sanityData);
        return enrichedData.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean);
    },
    ['paginated-articles-list'],
    // OPTIMIZATION: Infinite cache
    { 
        revalidate: false, 
        tags: ['article', 'content'] 
    }
);

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`api-articles-${ip}`, 20);
        if (!limitCheck.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { searchParams } = new URL(req.url);
        
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');
        const gameSlug = searchParams.get('game') || undefined;
        const searchTerm = searchParams.get('q') || undefined;
        const tagSlugsString = searchParams.get('tags');
        const tagSlugs = tagSlugsString ? tagSlugsString.split(',') : undefined;
        const sort = (searchParams.get('sort') as 'latest' | 'viral') || 'latest';

        const data = await getCachedPaginatedArticles(
            gameSlug, 
            tagSlugs, 
            searchTerm, 
            offset, 
            limit,
            sort
        );

        const response = NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

        // CACHE CONTROL: Force browser caching, but revalidate at Edge
        response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=31536000, must-revalidate');

        return response;

    } catch (error) {
        console.error('Error fetching paginated articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles data' }, { status: 500 });
    }
}