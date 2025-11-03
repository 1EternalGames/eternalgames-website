// components/comments/CommentList.tsx
'use client';
import CommentItem from './CommentItem';
import type { Session } from 'next-auth';
import styles from './Comments.module.css';

export default function CommentList({ comments, session, slug, onVoteUpdate, onPostReply, onDeleteSuccess, onUpdateSuccess }: {
    comments: any[],
    session: Session | null,
    slug: string,
    onVoteUpdate: (commentId: string, newVotes: any[]) => void,
    onPostReply: (content: string, parentId?: string) => Promise<void>,
    onDeleteSuccess: (deletedId: string, wasDeleted: boolean, updatedComment?: any) => void,
    onUpdateSuccess: (updatedComment: any) => void,
}) {
    if (comments.length === 0) {
        return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '4rem' }}>كن أول من يخط حرفًا هنا.</p>
    }
    return (
        <div className={styles.commentList}>
            {comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    session={session}
                    slug={slug}
                    onVoteUpdate={onVoteUpdate}
                    onPostReply={onPostReply}
                    onDeleteSuccess={onDeleteSuccess} // Pass down callback
                    onUpdateSuccess={onUpdateSuccess} // Pass down callback
                />
            ))}
        </div>
    )
}





