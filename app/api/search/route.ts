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
    // FIX: cache: 'no-store' prevents Next.js from writing these infinite permutations to the Data Cache (ISR Writes).
    // Sanity's CDN will still handle repeated requests efficiently if useCdn is true globally, 
    // but here we want to avoid Vercel cache explosion.
    const results = await client.fetch<SanitySearchResult[]>(
      searchQuery, 
      { searchTerm: query },
      { cache: 'no-store' } 
    );
    
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