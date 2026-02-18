// app/studio/comments/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

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

    // --- ENRICHMENT STEP ---
    // Extract unique slugs to fetch their Sanity types
    const slugs = Array.from(new Set(comments.map(c => c.contentSlug)));
    
    if (slugs.length > 0) {
        try {
            // Fetch only slug and _type
            const query = groq`*[_type in ["review", "article", "news", "gameRelease"] && slug.current in $slugs] {
                "slug": slug.current,
                _type
            }`;
            const sanityDocs = await client.fetch(query, { slugs });
            
            // Map slugs to types
            const typeMap = new Map(sanityDocs.map((d: any) => [d.slug, d._type]));
            
            // Attach type to comments
            return comments.map(c => ({
                ...c,
                contentType: typeMap.get(c.contentSlug) || null
            }));

        } catch (error) {
            console.error("Failed to resolve content types for comments:", error);
            // Return comments without types on failure (link might fail but UI loads)
            return comments.map(c => ({ ...c, contentType: null }));
        }
    }

    return comments.map(c => ({ ...c, contentType: null }));
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