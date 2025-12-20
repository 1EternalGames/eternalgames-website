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
import ActionButton from '../ActionButton';
import styles from './Comments.module.css';

const ReplyIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path> </svg> );
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
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
    
    const userRoles = (session?.user as any)?.roles || [];
    const isAuthor = session?.user?.id === comment.author.id;
    const isModerator = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    const canDelete = isAuthor || isModerator;

    const handleToggleReplies = async () => { if (areRepliesVisible) { setAreRepliesVisible(false); return; } setIsLoadingReplies(true); setAreRepliesVisible(true); if (replies.length < replyCount) { const result = await getReplies(comment.id); if (result.success) { setReplies(result.replies as any[]); } } setIsLoadingReplies(false); };
    
    const handleDeleteConfirm = () => {
        startTransition(async () => {
            const result = await deleteComment(comment.id);
            if (result.success) {
                onDeleteSuccess(result.deletedId || comment.id, result.wasDeleted ?? false, result.updatedComment);
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
    
    const DeletedState = () => ( <div className={`${styles.commentItem} ${styles.deleted}`}> <div className={styles.commentAuthorInfo}> <div className={styles.deletedAvatar} /> <div> <p className={`${styles.commentAuthorLink} ${styles.deleted}`}>طُمِسَ التعليق</p> <TimeStamp date={comment.createdAt} /> </div> </div> </div> );

    if (comment.isDeleted) { return ( <> <DeletedState /> {replyCount > 0 && ( <div className={styles.commentRepliesList}> {(replies || []).map((reply: any) => ( <CommentItem key={reply.id} comment={reply} session={session} slug={slug} onVoteUpdate={onVoteUpdate} onPostReply={onPostReply} onDeleteSuccess={onDeleteSuccess} onUpdateSuccess={onUpdateSuccess} /> ))} </div> )} </> ); }

    return ( <> <motion.div className={styles.commentItem} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}> <div className={styles.commentHeader}> <div className={styles.commentAuthorInfo}>
        {/* FIX: Disable prefetch to avoid loading every commenter's profile */}
        <Link href={`/profile/${comment.author.username}`} prefetch={false}><Image src={comment.author.image || '/default-avatar.svg'} alt={comment.author.name || 'User Avatar'} width={40} height={40} className="user-avatar" /></Link>
        <div className={styles.authorAndTimestamp}>
            {/* FIX: Disable prefetch here too */}
            <Link 
                href={`/profile/${comment.author.username}`} 
                prefetch={false}
                className={`${styles.commentAuthorLink} no-underline ${comment.isOptimistic ? styles.pulsingText : ''}`}
            >
                {comment.author.name}
            </Link>
            {!comment.isOptimistic && <TimeStamp date={comment.createdAt} />}
        </div>
    </div> 
    {session?.user && !comment.isOptimistic && ( <ActionButton onClick={() => setIsReplying(!isReplying)} aria-label="Reply" disabled={isPending}> <ReplyIcon /> </ActionButton> )} 
    </div> <AnimatePresence mode="wait"> {!isEditing ? ( <motion.div key="display" variants={animationVariants} initial="initial" animate="animate" exit="exit"> 
    <div className={styles.commentBody}>
        <p className={comment.isOptimistic ? styles.pulsingText : ''}>{comment.content}</p>
    </div> 
    <div className={styles.commentFooter}> 
    {!comment.isOptimistic && (
        <>
            <CommentVoteButtons commentId={comment.id} initialVotes={comment.votes} onVoteUpdate={onVoteUpdate} /> 
            {replyCount > 0 && (<button onClick={handleToggleReplies} className={`outline-button ${styles.viewRepliesButton}`} disabled={isLoadingReplies}>{isLoadingReplies ? 'جارٍ التحميل...' : areRepliesVisible ? 'إخفاء الردود' : `عرض ${replyCount} ${replyCount > 1 ? 'ردود' : 'رد'}`}</button>)} 
            {(isAuthor || canDelete) && ( <div className={styles.commentAuthorActions}>
                {isAuthor && <ActionButton onClick={() => setIsEditing(true)} aria-label="Edit" disabled={isPending}><EditIcon /></ActionButton>}
                {canDelete && <ActionButton onClick={() => setShowDeleteModal(true)} aria-label="Delete" disabled={isPending}><DeleteIcon /></ActionButton>}
            </div> )}
        </>
    )}
    </div> </motion.div> ) : ( <motion.div key="edit" variants={animationVariants} initial="initial" animate="animate" exit="exit" className={styles.commentEditForm}> <textarea defaultValue={comment.content} onChange={(e) => setEditText(e.target.value)} className="profile-input" disabled={isPending} autoFocus /> <div className={styles.commentEditActions}> <button onClick={handleUpdate} className="primary-button" disabled={isPending || editText.trim() === ''}>حفظ</button> <button onClick={() => setIsEditing(false)} className="outline-button" disabled={isPending}>إلغاء</button> </div> </motion.div> )} </AnimatePresence> <AnimatePresence> {isReplying && ( <motion.div className={styles.commentReplyFormContainer} variants={animationVariants} initial="initial" animate="animate" exit="exit"> <CommentForm slug={slug} session={session} parentId={comment.id} onPostComment={onPostReply} onReplySuccess={() => setIsReplying(false)} /> </motion.div> )} </AnimatePresence> {areRepliesVisible && ( <div className={styles.commentRepliesList}> {isLoadingReplies && <div className="spinner" />} {!isLoadingReplies && (replies).map((reply: any) => ( <CommentItem key={reply.id} comment={reply} session={session} slug={slug} onVoteUpdate={onVoteUpdate} onPostReply={onPostReply} onDeleteSuccess={onDeleteSuccess} onUpdateSuccess={onUpdateSuccess} /> ))} </div> )} </motion.div> <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} title="حذف التعليق" message="أمتأكدٌ من الحذف؟" /> </> );
}


