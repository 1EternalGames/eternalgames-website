// app/api/content-by-ids/route.ts

import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { contentByIdsQuery } from '@/lib/sanity.queries';

// This is the API endpoint the Constellation component calls.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validate the input from the client
    if (!Array.isArray(ids) || ids.length === 0) {
      // If no IDs are provided, return an empty array immediately.
      return NextResponse.json([]);
    }

    // Use the existing, correct query from your queries file
    const content = await client.fetch(contentByIdsQuery, { ids });

    // Return the found content to the client
    return NextResponse.json(content);
    
  } catch (error) {
    console.error('API Error in /api/content-by-ids:', error);
    // If anything goes wrong, return a server error status
    return NextResponse.json(
      { error: 'Failed to fetch content by IDs.' },
      { status: 500 }
    );
  }
}





