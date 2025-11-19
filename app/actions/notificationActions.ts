// app/actions/notificationActions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';

export async function getNotifications() {
    try {
        const session = await getAuthenticatedSession();
        console.log(`[NOTIF-FETCH] Fetching for user ${session.user.id}`);
        
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            include: {
                sender: { select: { name: true, image: true, username: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        const unreadCount = await prisma.notification.count({
            where: { userId: session.user.id, read: false }
        });

        console.log(`[NOTIF-FETCH] Found ${notifications.length} items, ${unreadCount} unread.`);

        return { success: true, notifications, unreadCount };
    } catch (error) {
        console.error("[NOTIF-FETCH] Error:", error);
        return { success: false, error: 'Failed to fetch notifications.' };
    }
}

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