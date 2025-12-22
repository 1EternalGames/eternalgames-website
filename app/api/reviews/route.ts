// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedReviewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { unstable_cache } from 'next/cache';
import { ScoreFilter } from '@/components/filters/ReviewFilters';
import { enrichContentList } from '@/lib/enrichment';
import { standardLimiter } from '@/lib/rate-limit'; // Import Limiter

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
        const enrichedData = await enrichContentList(sanityData);
        return enrichedData.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean);
    },
    ['paginated-reviews-list'], 
    { 
        revalidate: false, 
        tags: ['review', 'content'] 
    }
);

export async function GET(req: NextRequest) {
    try {
        // --- RATE LIMITING ---
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`api-reviews-${ip}`, 20);
        if (!limitCheck.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        // ---------------------

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

        const response = NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

        response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=31536000, must-revalidate');
        
        return response;

    } catch (error) {
        console.error('Error fetching paginated reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews data' }, { status: 500 });
    }
}