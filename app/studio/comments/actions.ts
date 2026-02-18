// app/studio/comments/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';

export async function getPaginatedComments(offset: number, limit: number) {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR') && !session.user.roles.includes('ADMIN')) {
        throw new Error('Unauthorized');
    }

    const comments = await prisma.comment.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { name: true, image: true, username: true } }
        }
    });

    // We also return total count on first load if needed, but for infinite scroll just items is enough
    return comments;
}

export async function adminDeleteComment(commentId: string) {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR') && !session.user.roles.includes('ADMIN')) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true, content: '[تم الحذف بواسطة الإدارة]' }
        });
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Failed to delete' };
    }
}