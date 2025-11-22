// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedArticlesQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';
import { enrichContentList } from '@/lib/enrichment';

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
    { 
        revalidate: false, // Infinite cache
        tags: ['article', 'content'] // Revalidated on publish/edit
    }
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

        // OPTIMIZATION: Infinite CDN Cache (1 Year).
        response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=31536000, must-revalidate');

        return response;

    } catch (error) {
        console.error('Error fetching paginated articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles data' }, { status: 500 });
    }
}