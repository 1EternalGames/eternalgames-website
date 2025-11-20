// app/constellation/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';
import { client } from '@/lib/sanity.client';
import { contentByIdsQuery } from '@/lib/sanity.queries';
import { enrichContentList } from '@/lib/enrichment';
import ConstellationWrapper from './ConstellationWrapper';
import type { SanityContentObject } from '@/components/constellation/config';

async function getConstellationData() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return null; // Guest user
        }

        const userId = session.user.id;

        // 1. Fetch all user interactions in parallel
        const [engagements, shares, comments] = await Promise.all([
            prisma.engagement.findMany({
                where: { userId },
                select: { contentId: true }
            }),
            prisma.share.findMany({
                where: { userId },
                select: { contentId: true }
            }),
            prisma.comment.findMany({
                where: { authorId: userId },
                select: { contentSlug: true },
                distinct: ['contentSlug']
            })
        ]);

        // 2. Consolidate IDs
        const contentIds = new Set<number>();
        engagements.forEach(e => contentIds.add(e.contentId));
        shares.forEach(s => contentIds.add(s.contentId));
        
        const uniqueIds = Array.from(contentIds);
        
        // 3. Fetch Sanity Content
        let userContent: SanityContentObject[] = [];
        if (uniqueIds.length > 0) {
            const rawContent = await client.fetch(contentByIdsQuery, { ids: uniqueIds });
            userContent = (await enrichContentList(rawContent)) as SanityContentObject[];
        }

        return {
            userContent,
            commentedSlugs: comments.map(c => c.contentSlug),
            isGuest: false
        };

    } catch (error) {
        console.error("Failed to fetch server-side constellation data:", error);
        return null;
    }
}

export default async function ConstellationPage() {
    const initialData = await getConstellationData();

    return (
        <div style={{ paddingTop: 'var(--nav-height-scrolled)' }}>
            <ConstellationWrapper initialData={initialData} />
        </div>
    );
}