// app/releases/actions.ts
'use server';

import { sanityWriteClient } from '@/lib/sanity.server';
import { getAuthenticatedSession } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

export async function toggleReleasePin(releaseId: string, currentPinStatus: boolean) {
    try {
        const session = await getAuthenticatedSession();
        const userRoles = session.user.roles;
        const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

        if (!isAdminOrDirector) {
            return { success: false, message: 'غير مصرح لك.' };
        }

        // Toggle the isPinned field
        await sanityWriteClient
            .patch(releaseId)
            .set({ isPinned: !currentPinStatus })
            .commit();

        // THE FIX: Added 'max' profile argument
        revalidateTag('gameRelease', 'max');
        revalidateTag('content', 'max');

        return { success: true, message: !currentPinStatus ? 'تم تثبيت الإصدار.' : 'أزيل التثبيت.' };
    } catch (error) {
        console.error("Failed to toggle pin:", error);
        return { success: false, message: 'حدث خطأ.' };
    }
}