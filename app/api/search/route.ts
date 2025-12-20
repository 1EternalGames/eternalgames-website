import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { searchQuery } from '@/lib/sanity.queries';
import { SanitySearchResult } from '@/types/sanity';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  try {
    // OPTIMIZATION: Cache search results for 300 seconds
    const results = await client.fetch<SanitySearchResult[]>(
      searchQuery, 
      { searchTerm: query },
      { next: { revalidate: 300 } } 
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Sanity search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}


