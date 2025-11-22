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

export default function CommentSection({ slug, contentType, initialComments = [] }: { slug: string; contentType: string; initialComments?: any[] }) {
    const { data: session } = useSession();
    const typedSession = session as unknown as Session | null;

    const [comments, setComments] = useState<any[]>(initialComments);
    const [loading, setLoading] = useState(initialComments.length === 0);
    const currentPath = `/${contentType}/${slug}`;

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
    
    const handleVoteUpdate = (commentId: string, newVotes: any[]) => {
        const updateVotesRecursive = (commentsList: any[]): any[] => {
            return commentsList.map(comment => {
                if (comment.id === commentId) return { ...comment, votes: newVotes };
                if (comment.replies) return { ...comment, replies: updateVotesRecursive(comment.replies) };
                return comment;
            });
        };
        setComments(prevComments => updateVotesRecursive(prevComments));
    };

    const handleDeleteSuccess = (deletedId: string, wasDeleted: boolean, updatedComment?: any) => {
        const removeOrUpdateRecursive = (commentsList: any[]): any[] => {
            if (wasDeleted) {
                return commentsList.filter(c => {
                    if (c.replies) c.replies = removeOrUpdateRecursive(c.replies);
                    return c.id !== deletedId;
                });
            } else {
                return commentsList.map(c => {
                    if (c.id === deletedId) return updatedComment;
                    if (c.replies) return { ...c, replies: removeOrUpdateRecursive(c.replies) };
                    return c;
                });
            }
        };
        setComments(prevComments => removeOrUpdateRecursive(prevComments));
    };

    const handleUpdateSuccess = (updatedComment: any) => {
        const updateRecursive = (commentsList: any[]): any[] => {
            return commentsList.map(c => {
                if (c.id === updatedComment.id) return updatedComment;
                if (c.replies) return { ...c, replies: updateRecursive(c.replies) };
                return c;
            });
        };
        setComments(prevComments => updateRecursive(prevComments));
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