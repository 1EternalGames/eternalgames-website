// components/comments/CommentsFetcher.tsx
import prisma from '@/lib/prisma';
import CommentSection from './CommentSection';

export default async function CommentsFetcher({ slug, contentType }: { slug: string, contentType: string }) {
    // This component runs on the server.
    // It performs the blocking DB fetch here, allowing the rest of the page to load first.
    
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

    return <CommentSection slug={slug} contentType={contentType} initialComments={comments} />;
}