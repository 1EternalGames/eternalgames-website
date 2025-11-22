// app/api/content-by-ids/route.ts

import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity.client';
import { contentByIdsQuery } from '@/lib/sanity.queries';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([]);
    }
    const content = await client.fetch(contentByIdsQuery, { ids });

    return NextResponse.json(content);

  } catch (error) {
    console.error('API Error in /api/content-by-ids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content by IDs.' },
      { status: 500 }
    );
  }
}