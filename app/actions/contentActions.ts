// app/actions/contentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';
import { EngagementType } from '@/lib/generated/client';
import { revalidateTag } from 'next/cache';
import { standardLimiter } from '@/lib/rate-limit'; // Security Import
import { headers } from 'next/headers';

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
        
        // Rate Limit (10 requests per 10s is generous enough for clicking, but stops scripts)
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`bookmark-${session.user.id}-${ip}`, 10);
        if (!limitCheck.success) return { success: false, error: "تم تجاوز الحد المسموح." };

        await setEngagement(session.user.id, contentId, contentType, 'BOOKMARK', isBookmarked);
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL: setBookmarkAction failed:", error);
        return { success: false, error: error.message || 'طرأ خطبٌ ما.' };
    }
}

export async function setLikeAction(contentId: number, contentType: string, contentSlug: string, isLiked: boolean) {
    try {
        const session = await getAuthenticatedSession();

        // Rate Limit
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`like-${session.user.id}-${ip}`, 20); // Higher limit for rapid liking
        if (!limitCheck.success) return { success: false, error: "تم تجاوز الحد المسموح." };

        await setEngagement(session.user.id, contentId, contentType, 'LIKE', isLiked);
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

        // Rate Limit (Strict - sharing is heavy)
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await standardLimiter.check(`share-${userId}-${ip}`, 5);
        if (!limitCheck.success) return { success: false, error: "تم تجاوز الحد المسموح." };

        await prisma.share.create({
            data: { userId, contentId, contentType },
        });
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