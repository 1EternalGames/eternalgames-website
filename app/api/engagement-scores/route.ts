// app/api/engagement-scores/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const contentTypes = ['review', 'article', 'news'];
    
    // Find all unique contentIds across all types with a LIKE engagement
    const contentIdsQuery = await prisma.engagement.findMany({
        where: { contentType: { in: contentTypes }, type: 'LIKE' },
        select: { contentId: true },
        distinct: ['contentId']
    });
    const ids = contentIdsQuery.map(i => i.contentId);

    // Aggregate Likes and Shares in parallel for all found IDs
    const [likes, shares] = await Promise.all([
        prisma.engagement.groupBy({
            by: ['contentId'],
            where: { contentId: { in: ids }, type: 'LIKE' },
            _count: { userId: true },
        }),
        prisma.share.groupBy({
            by: ['contentId'],
            where: { contentId: { in: ids } },
            _count: { userId: true },
        })
    ]);
    
    // Aggregate results and calculate viral score
    const result = ids.map(id => {
        const likeCount = likes.find(s => s.contentId === id)?._count.userId || 0;
        const shareCount = shares.find(s => s.contentId === id)?._count.userId || 0;
        
        // Weighted viral score: Shares (x5) + Likes (x2)
        const engagementScore = (likeCount * 2) + (shareCount * 5); 
        
        return { id, engagementScore };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch engagement scores:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 });
  }
}