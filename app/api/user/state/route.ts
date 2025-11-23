// app/api/user/state/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const [engagements, shares] = await Promise.all([
            prisma.engagement.findMany({ 
                where: { userId: session.user.id }, 
                select: { contentId: true, contentType: true, type: true } 
            }),
            prisma.share.findMany({ 
                where: { userId: session.user.id }, 
                select: { contentId: true, contentType: true } 
            }),
        ]);

        return NextResponse.json({ success: true, data: { engagements, shares } });
    } catch (error) {
        console.error('Error fetching user state:', error);
        return NextResponse.json({ success: false, data: null }, { status: 500 });
    }
}