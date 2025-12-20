// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAuthenticatedSession();
        
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

        return NextResponse.json({ success: true, notifications, unreadCount });
    } catch (error) {
        // Return empty if unauthorized or error, to fail gracefully without crashing UI
        return NextResponse.json({ success: false, notifications: [], unreadCount: 0 }, { status: 200 });
    }
}


