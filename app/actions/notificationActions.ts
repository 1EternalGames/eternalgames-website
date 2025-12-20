// app/actions/notificationActions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';

// Removed getNotifications action as it's now handled by the API route

export async function markNotificationAsRead(notificationId: string) {
    try {
        const session = await getAuthenticatedSession();
        await prisma.notification.updateMany({
            where: { id: notificationId, userId: session.user.id },
            data: { read: true }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to mark as read.' };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await getAuthenticatedSession();
        await prisma.notification.updateMany({
            where: { userId: session.user.id, read: false },
            data: { read: true }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to mark all as read.' };
    }
}


