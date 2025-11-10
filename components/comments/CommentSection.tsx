// components/comments/CommentSection.tsx
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { postReplyOrComment, deleteComment, updateComment, voteOnComment } from '@/app/actions/commentActions';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import SignInPrompt from './SignInPrompt';

const addReplyToState = (comments: any[], parentId: string, reply: any): any[] => {
    return comments.map(comment => {
        if (comment.id === parentId) {
            return {
                ...comment,
                replies: [reply, ...(comment.replies || [])],
                _count: { ...comment._count, replies: (comment._count?.replies || 0) + 1 }
            };
        }
        if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: addReplyToState(comment.replies, parentId, reply) };
        }
        return comment;
    });
};

export default function CommentSection({ slug, initialComments }: {
    slug: string;
    initialComments: any[]; 
}) {
    const { data: session } = useSession();
    const typedSession = session as unknown as Session | null;
    const [comments, setComments] = useState(initialComments);

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const [optimisticComments, addOptimisticComment] = useOptimistic(
        comments,
        (currentState, { action, payload }: { action: 'add', payload: any }) => {
            if (action === 'add') {
                if (payload.parentId) {
                    return addReplyToState(currentState, payload.parentId, payload);
                } else {
                    return [payload, ...currentState];
                }
            }
            return currentState;
        }
    );

    const handlePostComment = async (content: string, parentId?: string) => {
        if (!typedSession?.user?.id) return;

        const optimisticComment = {
            id: `optimistic-${Date.now()}`,
            content,
            contentSlug: slug,
            parentId,
            createdAt: new Date().toISOString(),
            author: typedSession.user,
            authorId: typedSession.user.id,
            votes: [],
            replies: [],
            _count: { replies: 0 },
            isOptimistic: true,
        };

        addOptimisticComment({ action: 'add', payload: optimisticComment });

        const result = await postReplyOrComment(content, slug, parentId);

        if (result.success && result.comment) {
            if (parentId) {
                setComments(currentComments => addReplyToState(currentComments, parentId, result.comment!));
            } else {
                setComments(currentComments => [result.comment!, ...currentComments]);
            }
        } else {
            setComments(comments);
        }
    };
    
    const handleVoteUpdate = (commentId: string, updatedVotes: any[]) => {
        const updateVotes = (list: any[]): any[] => list.map(c => {
            if (c.id === commentId) return { ...c, votes: updatedVotes };
            if (c.replies) return { ...c, replies: updateVotes(c.replies) };
            return c;
        });
        setComments(current => updateVotes(current));
    };

    const handleDeleteSuccess = (commentId: string, wasDeleted: boolean, updatedComment: any) => {
        const updateComments = (list: any[]): any[] => {
            if (wasDeleted) return list.filter(c => c.id !== commentId);
            return list.map(c => {
                if (c.id === commentId) return updatedComment;
                if (c.replies) return { ...c, replies: updateComments(c.replies) };
                return c;
            });
        };
        setComments(current => updateComments(current));
    };
    
    const handleUpdateSuccess = (updatedComment: any) => {
        const updateComments = (list: any[]): any[] => list.map(c => {
            if (c.id === updatedComment.id) return { ...c, ...updatedComment };
            if (c.replies) return { ...c, replies: updateComments(c.replies) };
            return c;
        });
        setComments(current => updateComments(current));
    };


    return (
        <div style={{ paddingTop: '4rem' }}>
            {typedSession ? (
                <CommentForm
                    slug={slug}
                    session={typedSession}
                    onPostComment={handlePostComment}
                />
            ) : (
                <SignInPrompt />
            )}
            
            <div> 
                <CommentList
                    comments={optimisticComments}
                    session={typedSession}
                    slug={slug}
                    onVoteUpdate={handleVoteUpdate}
                    onPostReply={handlePostComment}
                    onDeleteSuccess={handleDeleteSuccess}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            </div>
        </div>
    );
}