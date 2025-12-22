// app/actions/commentActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { VoteType, NotificationType } from '@/lib/generated/client';
import { getAuthenticatedSession } from '@/lib/auth';
import { sensitiveLimiter } from '@/lib/rate-limit';
import { commentSchema } from '@/lib/validations';
import { headers } from 'next/headers';

export async function postReplyOrComment(contentSlug: string, content: string, path: string, parentId?: string) {
    try {
        const session = await getAuthenticatedSession();
        const userId = session.user.id;

        // 1. Rate Limiting (IP + UserID)
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitKey = `comment-${userId}-${ip}`;
        const limitCheck = await sensitiveLimiter.check(limitKey, 5); // Max 5 comments per minute
        
        if (!limitCheck.success) {
            return { success: false, error: 'تم تجاوز حد التعليقات. يرجى الانتظار قليلاً.' };
        }

        // 2. Input Validation & Sanitization
        const validation = commentSchema.safeParse({ content, contentSlug, parentId });
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message };
        }
        
        const safeData = validation.data;

        const newComment = await prisma.comment.create({
            data: { 
                contentSlug: safeData.contentSlug, 
                content: safeData.content, 
                authorId: userId, 
                parentId: safeData.parentId || null 
            },
            include: {
                author: { select: { id: true, name: true, image: true, username: true } },
                votes: true,
                _count: { select: { replies: true } }
            }
        });

        // --- NOTIFICATION LOGIC ---
        if (parentId) {
            try {
                const parentComment = await prisma.comment.findUnique({
                    where: { id: parentId },
                    select: { authorId: true }
                });

                if (parentComment && parentComment.authorId !== session.user.id) {
                    await prisma.notification.create({
                        data: {
                            userId: parentComment.authorId,
                            senderId: session.user.id,
                            type: NotificationType.REPLY,
                            resourceId: newComment.id,
                            resourceSlug: contentSlug,
                            link: `${path}#comment-${newComment.id}`
                        }
                    });
                }
            } catch (notifError) {
                // Silently fail notifications to not block comment
            }
        }
        // --------------------------

        revalidatePath(path);
        return { success: true, comment: newComment };
    } catch (error: any) {
        return { success: false, error: error.message || "تعذر نشر التعليق." };
    }
}

export async function deleteComment(commentId: string) {
    try {
        const session = await getAuthenticatedSession();
        // Validation for ID format could be added here if using uuids strictly
        
        const commentToDelete = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { _count: { select: { replies: true } } }
        });
        
        if (!commentToDelete) return { success: false, error: 'التعليق غير موجود.' };

        const userRoles = session.user.roles || [];
        const isAuthor = commentToDelete.authorId === session.user.id;
        const isModerator = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

        if (!isAuthor && !isModerator) {
            return { success: false, error: 'غير مصرح لك.' };
        }

        if (commentToDelete._count.replies > 0) {
            const updatedComment = await prisma.comment.update({
                where: { id: commentId },
                data: { content: '[طُمِسَ التعليق]', isDeleted: true }
            });
            return { success: true, wasDeleted: false, updatedComment };
        } else {
            await prisma.comment.delete({ where: { id: commentId } });
            return { success: true, wasDeleted: true, deletedId: commentId };
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'يأبى التعليقُ الحذف.' };
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        const session = await getAuthenticatedSession();
        
        // Rate Limit Updates too
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`update-comment-${session.user.id}-${ip}`, 10);
        if (!limitCheck.success) return { success: false, error: "مهلاً، أبطئ قليلاً." };

        // Validation
        const validation = commentSchema.pick({ content: true }).safeParse({ content });
        if (!validation.success) return { success: false, error: validation.error.issues[0].message };

        const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true, contentSlug: true } });
        if (!comment || comment.authorId !== session.user.id) return { success: false, error: 'غير مصرح لك.' };

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content: validation.data.content },
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
        return { success: false, error: error.message || "أخفق التحديث." };
    }
}

export async function voteOnComment(commentId: string, voteType: VoteType) {
    try {
        const session = await getAuthenticatedSession();
        // Rate limit voting to prevent spam clicking
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`vote-${session.user.id}-${ip}`, 30); // 30 votes per minute
        if (!limitCheck.success) throw new Error("تم تجاوز حد التصويت.");

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
        return { success: false, error: error.message || 'تعذّر تسجيل التصويت.' };
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
        return { success: false, error: 'أبت الردودُ أن تُجلَب.' };
    }
}