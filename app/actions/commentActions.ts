// app/actions/commentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { VoteType } from '@prisma/client';
import { getAuthenticatedSession } from '@/lib/auth'; // <-- IMPORT HELPER

export async function postReplyOrComment(contentSlug: string, content: string, parentId?: string) {
    try {
        const session = await getAuthenticatedSession();
        if (!content || content.trim().length === 0) return { success: false, error: 'لا يمكن نشر تعليق فارغ.' };

        const newComment = await prisma.comment.create({
            data: { contentSlug, content, authorId: session.user.id, parentId },
            include: {
                author: { select: { id: true, name: true, image: true, username: true } },
                votes: true,
                _count: { select: { replies: true } }
            }
        });
        return { success: true, comment: newComment };
    } catch (error: any) {
        return { success: false, error: error.message || "تعذر نشر التعليق." };
    }
}

export async function deleteComment(commentId: string) {
    try {
        const session = await getAuthenticatedSession();
        const commentToDelete = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { _count: { select: { replies: true } } }
        });
        if (!commentToDelete || commentToDelete.authorId !== session.user.id) return { success: false, error: 'غير مصرح لك.' };

        if (commentToDelete._count.replies > 0) {
            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: { content: '[Comment deleted]', isDeleted: true }
            });
            return { success: true, wasDeleted: false, updatedComment };
        } else {
            await prisma.comment.delete({ where: { id: commentId } });
            return { success: true, wasDeleted: true, deletedId: commentId };
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Could not delete comment.' };
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        const session = await getAuthenticatedSession();
        if (!content || content.trim().length === 0) return { success: false, error: 'لا يمكن نشر تعليق فارغ.' };

        const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true, contentSlug: true } });
        if (!comment || comment.authorId !== session.user.id) return { success: false, error: 'غير مصرح لك.' };

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: {
                author: { select: { id: true, name: true, image: true, username: true } },
                votes: true,
                _count: { select: { replies: true } }
            }
        });

        revalidatePath(`/reviews/${comment.contentSlug}`);
        revalidatePath(`/articles/${comment.contentSlug}`);
        revalidatePath(`/news/${comment.contentSlug}`);
        return { success: true, updatedComment };
    } catch (error: any) {
        return { success: false, error: error.message || "فشل التحديث." };
    }
}

export async function voteOnComment(commentId: string, voteType: VoteType) {
    try {
        const session = await getAuthenticatedSession();
        const existingVote = await prisma.commentVote.findUnique({ where: { userId_commentId: { userId: session.user.id, commentId } } });
        
        if (existingVote) {
            if (existingVote.type === voteType) { await prisma.commentVote.delete({ where: { id: existingVote.id } }); } 
            else { await prisma.commentVote.update({ where: { id: existingVote.id }, data: { type: voteType } }); }
        } else {
            await prisma.commentVote.create({ data: { userId: session.user.id, commentId, type: voteType } });
        }
        
        const updatedComment = await prisma.comment.findUnique({ where: { id: commentId }, select: { votes: true } });
        if (!updatedComment) throw new Error("Comment not found after vote update.");
        return { success: true, updatedVotes: updatedComment.votes };
    } catch (error: any) {
        return { success: false, error: error.message || 'تعذر تسجيل التصويت.' };
    }
}

export async function getReplies(parentId: string) {
    try {
        const replies = await prisma.comment.findMany({
            where: { parentId },
            include: {
                author: { select: { id: true, name: true, image: true, username: true } },
                votes: true,
                _count: { select: { replies: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        return { success: true, replies };
    } catch (error) {
        return { success: false, error: 'فشل جلب الردود.' };
    }
}








