// app/api/news-engagement/route.ts

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Find all unique legacyIds (contentIds) tagged as 'خبر' and of type 'LIKE'
    const contentIdsQuery = await prisma.engagement.findMany({
        where: { contentType: 'خبر', type: 'LIKE' },
        select: { contentId: true },
        distinct: ['contentId']
    });
    const ids = contentIdsQuery.map((i: any) => i.contentId);

    // 2. Aggregate Likes and Shares separately
    const likes = await prisma.engagement.groupBy({
        by: ['contentId'],
        where: { contentId: { in: ids }, contentType: 'خبر', type: 'LIKE' },
        _count: { userId: true },
    });

    const shares = await prisma.share.groupBy({
        by: ['contentId'],
        where: { contentId: { in: ids }, contentType: 'خبر' },
        _count: { userId: true },
    });
    
    // Note: We cannot reliably calculate comments in this API without complex database mappings, 
    // so we maintain the weighted scoring structure based on available data (Likes/Shares).

    // 3. Aggregate results and calculate viral score
    const result = ids.map((id: number) => {
        const likeCount = likes.find((s: any) => s.contentId === id)?._count.userId || 0;
        const shareCount = shares.find((s: any) => s.contentId === id)?._count.userId || 0;
        
        // Weighted viral score: Shares (x5) + Likes (x2)
        const engagementScore = likeCount * 2 + shareCount * 5; 
        
        return {
            id,
            engagementScore,
        };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch news engagement:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 });
  }
}