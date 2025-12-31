import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { searchQuery } from '@/lib/sanity.queries';
import { SanitySearchResult } from '@/types/sanity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  try {
    // REMOVED: { next: { revalidate: 300 } }
    // We do NOT want to cache search results in Vercel's Data Cache.
    // Unique queries (infinite possibilities) would fill the cache storage limit immediately.
    // Sanity's CDN will handle repeated queries efficiently enough.
    const results = await client.fetch<SanitySearchResult[]>(
      searchQuery, 
      { searchTerm: query }
    );
    
    // Cache in the user's browser for a short time to make the UI snappy while typing,
    // but don't store it on the server.
    return NextResponse.json(results, {
        headers: {
            'Cache-Control': 'public, max-age=60' 
        }
    });
  } catch (error) {
    console.error('Sanity search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}