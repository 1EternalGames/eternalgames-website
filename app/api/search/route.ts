import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

interface SanitySearchResult {
  _id: string;
  _type: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const searchQuery = `*[_type in ["post", "page", "game"] && (title match $searchTerm || body match $searchTerm || excerpt match $searchTerm)] {
    _id,
    _type,
    title,
    slug,
    excerpt
  }[0...10]`;

  try {
    const results = await client.fetch<SanitySearchResult[]>(searchQuery, { searchTerm: `*${query}*` });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Sanity search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}