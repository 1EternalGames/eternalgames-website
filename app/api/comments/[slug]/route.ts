// app/api/comments/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensures this route is always server-rendered

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
    try {
        const { slug } = params;

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }
        
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { 
                author: { select: { id: true, name: true, image: true, username: true } }, 
                votes: true, 
                _count: { select: { replies: true } }, 
                replies: { 
                    take: 2, 
                    include: { 
                        author: { select: { id: true, name: true, image: true, username: true } }, 
                        votes: true, 
                        _count: { select: { replies: true } } 
                    }, 
                    orderBy: { createdAt: 'asc' } 
                } 
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(comments);

    } catch (error) {
        console.error('API Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments.' }, { status: 500 });
    }
}