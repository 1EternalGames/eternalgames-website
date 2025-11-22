// app/actions/contentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';
import { EngagementType } from '@/lib/generated/client';
import { revalidateTag } from 'next/cache';

async function setEngagement(userId: string, contentId: number, contentType: string, engagementType: EngagementType, isEngaged: boolean) {
    const whereClause = {
        userId_contentId_contentType_type: { userId, contentId, contentType, type: engagementType },
    };

    if (isEngaged) {
        await prisma.engagement.upsert({
            where: whereClause,
            update: {},
            create: { userId, contentId, contentType, type: engagementType },
        });
    } else {
        await prisma.engagement.deleteMany({
            where: { userId, contentId, contentType, type: engagementType },
        });
    }
}

export async function setBookmarkAction(contentId: number, contentType: string, isBookmarked: boolean) {
    try {
        const session = await getAuthenticatedSession();
        await setEngagement(session.user.id, contentId, contentType, 'BOOKMARK', isBookmarked);
        // Bookmarks don't affect viral score, so no revalidation needed here.
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL: setBookmarkAction failed:", error);
        return { success: false, error: error.message || 'طرأ خطبٌ ما.' };
    }
}

export async function setLikeAction(contentId: number, contentType: string, contentSlug: string, isLiked: boolean) {
    try {
        const session = await getAuthenticatedSession();
        await setEngagement(session.user.id, contentId, contentType, 'LIKE', isLiked);
        
        // THE FIX: Added 'max' profile argument
        revalidateTag('engagement-scores', 'max');
        
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL: setLikeAction failed:", error);
        return { success: false, error: error.message || 'طرأ خطبٌ ما.' };
    }
}

export async function recordShareAction(contentId: number, contentType: string, contentSlug: string) {
    try {
        const session = await getAuthenticatedSession();
        const userId = session.user.id;

        await prisma.share.create({
            data: { userId, contentId, contentType },
        });

        // THE FIX: Added 'max' profile argument
        revalidateTag('engagement-scores', 'max');
        
        const updatedShares = await prisma.share.findMany({
            where: { userId },
            select: { contentId: true, contentType: true }
        });
        
        return { success: true, shares: updatedShares, message: 'Share recorded.' };
    } catch (error: any) {
        console.error("CRITICAL: recordShareAction failed:", error);
        return { success: false, error: error.message || 'Could not record share.' };
    }
}