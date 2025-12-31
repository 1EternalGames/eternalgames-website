// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedArticlesQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { enrichContentList } from '@/lib/enrichment';
import { standardLimiter } from '@/lib/rate-limit'; 

export const dynamic = 'force-dynamic'; // Prevent Next.js from trying to statically cache this route

export async function GET(req: NextRequest) {
    try {
        // Rate limiting is good to keep
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

        // REMOVED: unstable_cache. 
        // We now fetch directly. client.fetch uses Sanity CDN (cached) because useCdn is true in lib/sanity.client.ts
        const query = paginatedArticlesQuery(gameSlug, tagSlugs, searchTerm, offset, limit, sort);
        const sanityData = await client.fetch(query);
        const enrichedData = await enrichContentList(sanityData);
        const data = enrichedData.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean);

        const response = NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });

        // Browser Cache: Cache for 60 seconds locally, 1 hour on CDN/Edge
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=3600');

        return response;

    } catch (error) {
        console.error('Error fetching paginated articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles data' }, { status: 500 });
    }
}