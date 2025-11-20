// app/actions/contentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';
import { EngagementType } from '@/lib/generated/client';

/**
 * An idempotent function to set the state of an engagement.
 * It ensures the final state in the DB matches the desired `isEngaged` state.
 */
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
        // No revalidation needed; UI is handled optimistically by the client store.
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
        
        // THE FIX: Removed revalidatePath. 
        // The heart icon updates instantly via the client store.
        // We don't need to rebuild the entire HTML page just for a like.
        
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

        // THE FIX: Removed revalidatePath.
        // The store updates shares locally.
        
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