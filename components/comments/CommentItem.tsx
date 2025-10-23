// components/comments/CommentItem.tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from 'next-auth';
import { useState, useTransition, useMemo } from 'react';
import { deleteComment, updateComment, getReplies } from '@/app/actions/commentActions';
import ConfirmationModal from '../ConfirmationModal';
import CommentVoteButtons from './CommentVoteButtons';
import CommentForm from './CommentForm';
import Link from 'next/link';
import Image from 'next/image';
import TimeStamp from './TimeStamp';
import styles from './Comments.module.css';

const ReplyIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path> </svg> );
const animationVariants = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 } };

export default function CommentItem({ comment, session, slug, onVoteUpdate, onPostReply, onDeleteSuccess, onUpdateSuccess }: {
    comment: any;
    session: Session | null;
    slug: string;
    onVoteUpdate: (commentId: string, newVotes: any[]) => void;
    onPostReply: (content: string, parentId?: string) => Promise<void>;
    onDeleteSuccess: (deletedId: string, wasDeleted: boolean, updatedComment?: any) => void,
    onUpdateSuccess: (updatedComment: any) => void,
}) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replies, setReplies] = useState<any[]>(comment.replies || []);
    const [areRepliesVisible, setAreRepliesVisible] = useState(true);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const replyCount = comment._count?.replies || 0;
    const isAuthor = useMemo(() => session?.user?.id === comment.author.id, [session, comment.author.id]);

    const handleToggleReplies = async () => { if (areRepliesVisible) { setAreRepliesVisible(false); return; } setIsLoadingReplies(true); setAreRepliesVisible(true); if (replies.length < replyCount) { const result = await getReplies(comment.id); if (result.success) { setReplies(result.replies as any[]); } } setIsLoadingReplies(false); };
    
    const handleDeleteConfirm = () => {
        startTransition(async () => {
            const result = await deleteComment(comment.id);
            if (result.success) {
                onDeleteSuccess(result.deletedId || comment.id, result.wasDeleted, result.updatedComment);
            }
            setShowDeleteModal(false);
        });
    };

    const handleUpdate = () => {
        startTransition(async () => {
            const result = await updateComment(comment.id, editText);
            if(result.success && result.updatedComment) {
                onUpdateSuccess(result.updatedComment);
            }
            setIsEditing(false);
        });
    };
    
    const DeletedState = () => ( <div className={`${styles.commentItem} ${styles.deleted}`}> <div className={styles.commentAuthorInfo}> <div className={styles.deletedAvatar} /> <div> <p className={`${styles.commentAuthorLink} ${styles.deleted}`}>حُذِفَ التعليق</p> <TimeStamp date={comment.createdAt} /> </div> </div> </div> );

    if (comment.isDeleted) { return ( <> <DeletedState /> {replyCount > 0 && ( <div className={styles.commentRepliesList}> {(replies || []).map((reply: any) => ( <CommentItem key={reply.id} comment={reply} session={session} slug={slug} onVoteUpdate={onVoteUpdate} onPostReply={onPostReply} onDeleteSuccess={onDeleteSuccess} onUpdateSuccess={onUpdateSuccess} /> ))} </div> )} </> ); }

    return ( <> <motion.div className={styles.commentItem} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}> <div className={styles.commentHeader}> <div className={styles.commentAuthorInfo}>
        <Link href={`/profile/${comment.author.username}`}><Image src={comment.author.image || '/default-avatar.svg'} alt={comment.author.name || 'User Avatar'} width={40} height={40} className="user-avatar" /></Link>
        <div className={styles.authorAndTimestamp}>
            <Link 
                href={`/profile/${comment.author.username}`} 
                className={`${styles.commentAuthorLink} no-underline ${comment.isOptimistic ? styles.pulsingText : ''}`}
            >
                {comment.author.name}
            </Link>
            {!comment.isOptimistic && <TimeStamp date={comment.createdAt} />}
        </div>
    </div> 
    {session?.user && !comment.isOptimistic && ( <button onClick={() => setIsReplying(!isReplying)} className={styles.commentReplyButton} disabled={isPending}> <ReplyIcon /> </button> )} 
    </div> <AnimatePresence mode="wait"> {!isEditing ? ( <motion.div key="display" variants={animationVariants} initial="initial" animate="animate" exit="exit"> 
    <div className={styles.commentBody}>
        <p className={comment.isOptimistic ? styles.pulsingText : ''}>{comment.content}</p>
    </div> 
    <div className={styles.commentFooter}> 
    {!comment.isOptimistic && (
        <>
            <CommentVoteButtons commentId={comment.id} initialVotes={comment.votes} onVoteUpdate={onVoteUpdate} /> 
            {replyCount > 0 && (<button onClick={handleToggleReplies} className={`${styles.commentActionButton} ${styles.viewRepliesButton}`} disabled={isLoadingReplies}>{isLoadingReplies ? 'جار التحميل...' : areRepliesVisible ? 'إخفاء الردود' : `View ${replyCount} ${replyCount > 1 ? 'ردود' : 'رد'}`}</button>)} 
            {isAuthor && ( <div className={styles.commentAuthorActions}> <button onClick={() => setIsEditing(true)} className={styles.commentActionButton} disabled={isPending}>تحرير</button> <button onClick={() => setShowDeleteModal(true)} className={styles.commentActionButton} disabled={isPending}>حذف</button> </div> )}
        </>
    )}
    </div> </motion.div> ) : ( <motion.div key="edit" variants={animationVariants} initial="initial" animate="animate" exit="exit" className={styles.commentEditForm}> <textarea defaultValue={comment.content} onChange={(e) => setEditText(e.target.value)} className="profile-input" disabled={isPending} autoFocus /> <div className={styles.commentEditActions}> <button onClick={handleUpdate} className="primary-button" disabled={isPending || editText.trim() === ''}>حفظ</button> <button onClick={() => setIsEditing(false)} className="outline-button" disabled={isPending}>إلغاء</button> </div> </motion.div> )} </AnimatePresence> <AnimatePresence> {isReplying && ( <motion.div className={styles.commentReplyFormContainer} variants={animationVariants} initial="initial" animate="animate" exit="exit"> <CommentForm slug={slug} session={session} parentId={comment.id} onPostComment={onPostReply} onReplySuccess={() => setIsReplying(false)} /> </motion.div> )} </AnimatePresence> {areRepliesVisible && ( <div className={styles.commentRepliesList}> {isLoadingReplies && <div className="spinner" />} {!isLoadingReplies && (replies).map((reply: any) => ( <CommentItem key={reply.id} comment={reply} session={session} slug={slug} onVoteUpdate={onVoteUpdate} onPostReply={onPostReply} onDeleteSuccess={onDeleteSuccess} onUpdateSuccess={onUpdateSuccess} /> ))} </div> )} </motion.div> <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} title="حذف التعليق" message="هل أنت متيقن؟" /> </> );
}


