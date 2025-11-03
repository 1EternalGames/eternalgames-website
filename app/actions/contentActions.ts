// app/actions/contentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedSession } from '@/lib/auth';
import { EngagementType } from '@prisma/client';

/**
 * An idempotent function to set the state of an engagement.
 * It ensures the final state in the DB matches the desired `isEngaged` state.
 */
async function setEngagement(userId: string, contentId: number, contentType: string, engagementType: EngagementType, isEngaged: boolean) {
    const whereClause = {
        userId_contentId_contentType_type: { userId, contentId, contentType, type: engagementType },
    };

    if (isEngaged) {
        // If we want it to exist, create it if it doesn't. Do nothing if it already exists.
        await prisma.engagement.upsert({
            where: whereClause,
            update: {},
            create: { userId, contentId, contentType, type: engagementType },
        });
    } else {
        // If we want it to NOT exist, delete it. It's safe to call delete even if it's not there.
        // Using `deleteMany` with a `where` is a safe way to handle this without checking existence first.
        await prisma.engagement.deleteMany({
            where: { userId, contentId, contentType, type: engagementType },
        });
    }
}

export async function setBookmarkAction(contentId: number, contentType: string, isBookmarked: boolean) {
    try {
        const session = await getAuthenticatedSession();
        await setEngagement(session.user.id, contentId, contentType, 'BOOKMARK', isBookmarked);
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL: setBookmarkAction failed:", error);
        return { success: false, error: error.message || 'طرأ خطأ غير متوقع.' };
    }
}

export async function setLikeAction(contentId: number, contentType: string, contentSlug: string, isLiked: boolean) {
    try {
        const session = await getAuthenticatedSession();
        await setEngagement(session.user.id, contentId, contentType, 'LIKE', isLiked);
        
        // Revalidation is still useful here
        revalidatePath(`/${contentType}s/${contentSlug}`);
        
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL: setLikeAction failed:", error);
        return { success: false, error: error.message || 'طرأ خطأ غير متوقع.' };
    }
}

// recordShareAction remains unchanged as it's not a toggle.
export async function recordShareAction(contentId: number, contentType: string, contentSlug: string) {
    try {
        const session = await getAuthenticatedSession();
        const userId = session.user.id;

        await prisma.share.create({
            data: { userId, contentId, contentType },
        });

        revalidatePath(`/${contentType}s/${contentSlug}`);
        
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





