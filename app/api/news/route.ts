// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { paginatedNewsQuery } from '@/lib/sanity.queries';
import { adaptToCardProps } from '@/lib/adapters';
import { enrichContentList } from '@/lib/enrichment';
import { standardLimiter } from '@/lib/rate-limit'; 

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`api-news-${ip}`, 20);
        if (!limitCheck.success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { searchParams } = new URL(req.url);
        
        const offset = parseInt(searchParams.get('offset') || '50');
        const limit = parseInt(searchParams.get('limit') || '50');
        const gameSlug = searchParams.get('game') || undefined;
        const searchTerm = searchParams.get('q') || undefined;
        const tagSlugsString = searchParams.get('tags');
        const tagSlugs = tagSlugsString ? tagSlugsString.split(',') : undefined;
        const sort = (searchParams.get('sort') as 'latest' | 'viral') || 'latest';
        
        const tags = tagSlugs?.length === 0 ? undefined : tagSlugs;
        const query = paginatedNewsQuery(gameSlug, tags, searchTerm, offset, limit, sort);
        
        // FIX: Disable Data Cache
        const sanityData = await client.fetch(query, {}, { cache: 'no-store' });
        
        const enrichedData = await enrichContentList(sanityData);
        const data = enrichedData.map(item => adaptToCardProps(item, { width: 600 })).filter(Boolean);

        const response = NextResponse.json({
            data,
            nextOffset: data.length === limit ? offset + limit : null,
        });
        
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

        return response;

    } catch (error) {
        console.error('Error fetching paginated news:', error);
        return NextResponse.json({ error: 'Failed to fetch news data' }, { status: 500 });
    }
}