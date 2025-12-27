// app/api/universal/route.ts
import { NextResponse } from 'next/server';
import { fetchUniversalData } from '@/lib/universal-data';

// Force dynamic if needed, but since data is cached, we can allow caching here too
// Actually, setting revalidate ensures the API response itself is cached on the Edge
export const revalidate = 3600; 

export async function GET() {
    try {
        const data = await fetchUniversalData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch universal data' }, { status: 500 });
    }
}