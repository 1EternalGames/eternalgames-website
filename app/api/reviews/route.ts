// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedReviewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';
import { ScoreFilter } from '@/components/filters/ReviewFilters';
import { enrichContentList } from '@/lib/enrichment'; // <-- ADDED

const getCachedPaginatedReviews = unstable_cache(
    async (
        gameSlug: string | undefined, 
        tagSlugs: string[] | undefined, 
        searchTerm: string | undefined, 
        scoreRange: ScoreFilter | undefined,
        offset: number, 
        limit: number,
        sort: 'latest' | 'score'
    ) => {
        const query = paginatedReviewsQuery(gameSlug, tagSlugs, searchTerm, scoreRange, offset, limit, sort);
        const sanityData = await client.fetch(query);
        // THE FIX: Enrich data inside the cache function
        const enrichedData = await enrichContentList(sanityData);
        return enrichedData.map(adaptToCardProps).filter(Boolean);
    },
    ['paginated-reviews'],
    { tags: ['review'] }
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
        const sort = (searchParams.get('sort') as 'latest' | 'score') || 'latest';
        const scoreRange = searchParams.get('score') as ScoreFilter || undefined;

        const data = await getCachedPaginatedReviews(
            gameSlug, 
            tagSlugs, 
            searchTerm, 
            scoreRange,
            offset, 
            limit,
            sort
        );

        return NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

    } catch (error) {
        console.error('Error fetching paginated reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews data' }, { status: 500 });
    }
}