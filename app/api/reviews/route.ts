// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedReviewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { ScoreFilter } from '@/components/filters/ReviewFilters';
import { enrichContentList } from '@/lib/enrichment';
import { standardLimiter } from '@/lib/rate-limit'; 

// Force dynamic because we read searchParams, BUT we use 'fetch' caching below
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`api-reviews-${ip}`, 20);
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
        const sort = (searchParams.get('sort') as 'latest' | 'score') || 'latest';
        const scoreRange = searchParams.get('score') as ScoreFilter || undefined;

        const query = paginatedReviewsQuery(gameSlug, tagSlugs, searchTerm, scoreRange, offset, limit, sort);
        
        // CACHE FIX: Removed { cache: 'no-store' }
        // Replaced with tag-based revalidation.
        // This combination of query params will be cached indefinitely until 'review' tag is purged.
        const sanityData = await client.fetch(query, {}, { 
            next: { tags: ['review'] } 
        });
        
        const enrichedData = await enrichContentList(sanityData);
        const data = enrichedData.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean);

        const response = NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

        // Set browser cache headers to reduce hits to the Edge
        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes browser cache
        
        return response;

    } catch (error) {
        console.error('Error fetching paginated reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews data' }, { status: 500 });
    }
}