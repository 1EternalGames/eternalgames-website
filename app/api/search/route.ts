// app/api/search/route.ts
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
    // CACHE FIX: 'universal-base' updates whenever ANY content is published.
    // This allows search results to be cached "forever" until content actually changes.
    const results = await client.fetch<SanitySearchResult[]>(
      searchQuery, 
      { searchTerm: query },
      { 
        next: { tags: ['universal-base'] } 
      } 
    );
    
    return NextResponse.json(results, {
        headers: {
            // Browser cache for 2 minutes to prevent keystroke thrashing
            'Cache-Control': 'public, max-age=120' 
        }
    });
  } catch (error) {
    console.error('Sanity search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}