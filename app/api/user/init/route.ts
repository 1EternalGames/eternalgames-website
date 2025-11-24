// app/api/user/init/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // BATCH QUERY: Execute all independent DB operations in parallel
        const [engagements, shares, notifications, unreadCount] = await Promise.all([
            // 1. Engagements
            prisma.engagement.findMany({ 
                where: { userId }, 
                select: { contentId: true, contentType: true, type: true } 
            }),
            // 2. Shares
            prisma.share.findMany({ 
                where: { userId }, 
                select: { contentId: true, contentType: true } 
            }),
            // 3. Notifications List
            prisma.notification.findMany({
                where: { userId },
                include: {
                    sender: { select: { name: true, image: true, username: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            }),
            // 4. Unread Count
            prisma.notification.count({
                where: { userId, read: false }
            })
        ]);

        // Process User State
        const likes: string[] = [];
        const bookmarks: string[] = [];
        const shareKeys: string[] = [];

        engagements.forEach(e => {
            const key = `${e.contentType}-${e.contentId}`;
            if (e.type === 'LIKE') likes.push(key);
            else if (e.type === 'BOOKMARK') bookmarks.push(key);
        });

        shares.forEach(s => {
            shareKeys.push(`${s.contentType}-${s.contentId}`);
        });

        return NextResponse.json({ 
            success: true, 
            userState: { 
                likes, 
                bookmarks, 
                shares: shareKeys 
            },
            notifications: {
                items: notifications,
                unreadCount
            }
        });

    } catch (error) {
        console.error('Error in /api/user/init:', error);
        return NextResponse.json({ success: false, error: 'Initialization failed' }, { status: 500 });
    }
}