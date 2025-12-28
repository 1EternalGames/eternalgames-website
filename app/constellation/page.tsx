// app/constellation/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';
import { client } from '@/lib/sanity.client';
import { contentByIdsQuery } from '@/lib/sanity.queries';
import { enrichContentList } from '@/lib/enrichment';
import ConstellationWrapper from './ConstellationWrapper';
import type { SanityContentObject } from '@/components/constellation/config';

// Force dynamic rendering because this page relies on user session cookies
export const dynamic = 'force-dynamic';

async function getConstellationData() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) { 
            return null; // Guest user
        }

        const userId = session.user.id;

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

        const contentIds = new Set<number>();
        // THE FIX: Added explicit type annotations
        engagements.forEach((e: { contentId: number }) => contentIds.add(e.contentId));
        shares.forEach((s: { contentId: number }) => contentIds.add(s.contentId));
        
        const uniqueIds = Array.from(contentIds);
        
        let userContent: SanityContentObject[] = [];
        if (uniqueIds.length > 0) {
            const rawContent = await client.fetch(contentByIdsQuery, { ids: uniqueIds });
            userContent = (await enrichContentList(rawContent)) as SanityContentObject[];
        }

        return {
            userContent,
            // THE FIX: Added explicit type annotation
            commentedSlugs: comments.map((c: { contentSlug: string }) => c.contentSlug),
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
        // FIX: Removed padding-top so the 3D scene fills the background behind the transparent navbar
        <div style={{ paddingTop: 0 }}>
            <ConstellationWrapper initialData={initialData} />
        </div>
    );
}