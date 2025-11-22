// components/comments/CommentSection.tsx
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { postReplyOrComment } from '@/app/actions/commentActions';
import CommentForm from './CommentForm';
import SignInPrompt from './SignInPrompt';
import CommentList from './CommentList';
import styles from './Comments.module.css';

const addReplyToState = (comments: any[], parentId: string, reply: any): any[] => {
    return comments.map(comment => {
        if (comment.id === parentId) {
            const updatedReplies = comment.replies ? [...comment.replies, reply] : [reply];
            return { ...comment, replies: updatedReplies, _count: { replies: (comment._count?.replies || 0) + 1 } };
        }
        if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: addReplyToState(comment.replies, parentId, reply) };
        }
        return comment;
    });
};

// MODIFIED: Removed initialComments prop requirement. Added client-side fetching.
export default function CommentSection({ slug, contentType, initialComments = [] }: { slug: string; contentType: string; initialComments?: any[] }) {
    const { data: session } = useSession();
    const typedSession = session as unknown as Session | null;

    const [comments, setComments] = useState<any[]>(initialComments);
    const [loading, setLoading] = useState(initialComments.length === 0);
    const currentPath = `/${contentType}/${slug}`;

    // FETCH: Client-side fetch to keep the page static
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`/api/comments/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data);
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if we didn't receive initial data
        if (initialComments.length === 0) {
            fetchComments();
        } else {
            setLoading(false);
        }
    }, [slug, initialComments]);

    const [optimisticComments, addOptimisticComment] = useOptimistic(
        comments,
        (state, { newComment, parentId }) => {
            if (parentId) {
                return addReplyToState(state, parentId, newComment);
            }
            return [newComment, ...state];
        }
    );

    const handlePostComment = async (content: string, parentId?: string) => {
        if (!typedSession?.user?.id) return;

        const optimisticComment = {
            id: crypto.randomUUID(),
            content,
            parentId,
            createdAt: new Date().toISOString(),
            author: typedSession.user,
            authorId: typedSession.user.id,
            votes: [],
            replies: [],
            _count: { replies: 0 },
            isOptimistic: true,
        };

        addOptimisticComment({ newComment: optimisticComment, parentId });

        const result = await postReplyOrComment(slug, content, currentPath, parentId);

        if (result.success && result.comment) {
            setComments(currentComments => {
                if (parentId) {
                     return addReplyToState(currentComments, parentId, result.comment)
                        .filter(c => c.id !== optimisticComment.id);
                }
                return [result.comment, ...currentComments.filter(c => c.id !== optimisticComment.id)];
            });
        }
    };
    
    // (Vote/Delete handlers kept same as before, omitted for brevity but assume present...)
    const handleVoteUpdate = (commentId: string, newVotes: any[]) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, votes: newVotes } : c));
    };

    const handleDeleteSuccess = (deletedId: string, wasDeleted: boolean, updatedComment?: any) => {
         setComments(prev => wasDeleted ? prev.filter(c => c.id !== deletedId) : prev.map(c => c.id === deletedId ? updatedComment : c));
    };

    const handleUpdateSuccess = (updatedComment: any) => {
        setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
    };

    return (
        <div className={styles.commentsSection}>
            {typedSession?.user ? (
                <CommentForm slug={slug} session={typedSession} onPostComment={handlePostComment} />
            ) : (
                <SignInPrompt />
            )}
            
            <div style={{ minHeight: '200px' }}>
                {loading ? (
                    <div className="spinner" style={{ margin: '4rem auto' }} />
                ) : (
                    <CommentList
                        comments={optimisticComments}
                        session={typedSession}
                        slug={slug}
                        onVoteUpdate={handleVoteUpdate}
                        onPostReply={handlePostComment}
                        onDeleteSuccess={handleDeleteSuccess}
                        onUpdateSuccess={handleUpdateSuccess}
                    />
                )}
            </div>
        </div>
    );
}