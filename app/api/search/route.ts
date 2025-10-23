//  FIX #1: Revert to the correct, project-wide authenticated client
import { client } from '@/lib/sanity.client';
import { searchQuery } from '@/lib/sanity.queries';
import { SanitySearchResult } from '@/types/sanity';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const query = searchParams.get('q');

if (!query || query.length < 3) {
return NextResponse.json([], { status: 200 });
}

try {
const results: SanitySearchResult[] = await client.fetch(searchQuery, { query: `*${query}*` });
return NextResponse.json(results);
} catch (error) {
console.error('Sanity search failed:', error);
// This is where the "Search failed" message comes from.
return NextResponse.json({ error: 'An error occurred while searching.' }, { status: 500 });
}
}



























