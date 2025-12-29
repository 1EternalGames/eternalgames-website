// app/api/universal/route.ts
import { NextResponse } from 'next/server';
import { fetchUniversalData } from '@/lib/universal-data';

// OPTIMIZATION: Set to false (Infinite).
// This route will now return the exact same JSON forever until 
// the underlying 'fetchUniversalData' cache is invalidated by a Sanity Webhook.
export const revalidate = false; 

export async function GET() {
    try {
        const data = await fetchUniversalData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch universal data' }, { status: 500 });
    }
}