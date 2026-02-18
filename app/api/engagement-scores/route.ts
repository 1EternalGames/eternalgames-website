// api/engagement-scores/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const getCachedScores = unstable_cache(
    async () => {
        const contentTypes = ['review', 'article', 'news'];
        
        const contentIdsQuery = await prisma.engagement.findMany({
            where: { contentType: { in: contentTypes }, type: 'LIKE' },
            select: { contentId: true },
            distinct: ['contentId']
        });
        const ids = contentIdsQuery.map((i: any) => i.contentId);

        if (ids.length === 0) return [];

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
        
        return ids.map((id: number) => {
            const likeCount = likes.find((s: any) => s.contentId === id)?._count.userId || 0;
            const shareCount = shares.find((s: any) => s.contentId === id)?._count.userId || 0;
            
            const engagementScore = (likeCount * 2) + (shareCount * 5); 
            
            return { id, engagementScore };
        });
    },
    ['global-engagement-scores'], 
    { 
        revalidate: false,
        tags: ['engagement-scores'] 
    } 
);

export async function GET() {
  try {
    const result = await getCachedScores();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch engagement scores:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 });
  }
}