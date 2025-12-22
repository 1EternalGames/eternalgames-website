// components/comments/CommentForm.tsx
'use client';
import { useState, useTransition, FormEvent } from 'react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonLoader from '@/components/ui/ButtonLoader';
import styles from './Comments.module.css';
import { useToast } from '@/lib/toastStore'; // FIX: Import Toast

export default function CommentForm({
    slug,
    session,
    parentId,
    onPostComment,
    onReplySuccess,
}: {
    slug: string;
    session: Session | null;
    parentId?: string;
    // Update type to reflect it returns a result object now
    onPostComment: (content: string, parentId?: string) => Promise<any>; 
    onReplySuccess?: () => void;
}) {
    const [commentText, setCommentText] = useState('');
    const [isPending, startTransition] = useTransition();
    const isButtonDisabled = isPending || commentText.trim().length === 0;
    const { error: toastError } = useToast(); // FIX: Use Toast Hook

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = commentText;
        if (content.trim().length === 0) return;

        startTransition(async () => {
            const result = await onPostComment(content, parentId);
            
            // FIX: Check result success
            if (result && !result.success) {
                // Show error toast if rate limited or validaton failed
                toastError(result.error || "حدث خطأ أثناء نشر التعليق.");
                // Do NOT clear text so user doesn't lose their comment
            } else {
                // Only clear on success
                setCommentText('');
                if (parentId && onReplySuccess) {
                    onReplySuccess();
                }
            }
        });
    };

    return (
        <div className={styles.commentFormWrapper}>
            <div className={styles.commentFormAvatar}>
                <Image src={session!.user.image || '/default-avatar.svg'} alt={session!.user.name || 'User Avatar'} width={40} height={40} className="user-avatar" />
            </div>
            <div className={styles.commentFormMain}>
                <form onSubmit={handleSubmit}>
                    <textarea
                        name="comment"
                        placeholder="أدلِ برأيك..."
                        required
                        className="profile-input" 
                        disabled={isPending}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className={styles.commentEditActions}>
                        <motion.button type="submit" className={`${isButtonDisabled ? 'outline-button' : 'primary-button'}`} disabled={isButtonDisabled} animate={{ width: isPending ? '44px' : 'auto', height: '44px', borderRadius: isPending ? '50%' : '5px' }}>
                            <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{parentId ? 'أضف ردًا' : 'انشر التعليق'}</motion.span>}</AnimatePresence>
                        </motion.button>
                        {parentId && (<button type="button" onClick={onReplySuccess} className="outline-button">إلغاء</button>)}
                    </div>
                </form>
            </div>
        </div>
    );
}