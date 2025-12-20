// components/comments/CommentVoteButtons.tsx
'use client';
import { useTransition, useOptimistic, useRef } from 'react';
import { voteOnComment } from '@/app/actions/commentActions';
import { VoteType } from '@/lib/generated/client';
import { useUserStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { motion, useAnimationControls } from 'framer-motion';
import styles from './Comments.module.css';

const ThumbsUpIcon = ({ isActive }: { isActive: boolean }) => ( <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <motion.path d="M3,21a1,1,0,0,1-1-1V12a1,1,0,0,1,1-1H6V21ZM19.949,10H14.178V5c0-2-3.076-2-3.076-2s0,4-1.026,5C9.52,8.543,8.669,10.348,8,11V21H18.644a2.036,2.036,0,0,0,2.017-1.642l1.3-7A2.015,2.015,0,0,0,19.949,10Z" initial={false} animate={{ fill: isActive ? "currentColor" : "rgba(0,0,0,0)" }} transition={{ duration: 0.2, ease: "easeOut" as const }} stroke="currentColor" strokeWidth="1" /> </motion.svg> );
const ThumbsDownIcon = ({ isActive }: { isActive: boolean }) => ( <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleY(-1)' }}> <motion.path d="M3,21a1,1,0,0,1-1-1V12a1,1,0,0,1,1-1H6V21ZM19.949,10H14.178V5c0-2-3.076-2-3.076-2s0,4-1.026,5C9.52,8.543,8.669,10.348,8,11V21H18.644a2.036,2.036,0,0,0,2.017-1.642l1.3-7A2.015,2.015,0,0,0,19.949,10Z" initial={false} animate={{ fill: isActive ? "currentColor" : "rgba(0,0,0,0)" }} transition={{ duration: 0.2, ease: "easeOut" as const }} stroke="currentColor" strokeWidth="1" /> </motion.svg> );
type Vote = { userId: string; type: VoteType; };
const buttonVariants = { inactive: { scale: 1 }, active: { scale: [1, 1.3, 1.1], transition: { duration: 0.4, ease: "easeOut" as const } } }
const countVariants = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -10, opacity: 0 }, transition: { type: 'spring' as const, stiffness: 400, damping: 20 } };


export default function CommentVoteButtons({ commentId, initialVotes, onVoteUpdate }: { 
    commentId: string; 
    initialVotes: Vote[];
    onVoteUpdate: (commentId: string, newVotes: any[]) => void;
}) {
    const { data: session } = useSession();
    const setSignInModalOpen = useUserStore((s) => s.setSignInModalOpen);
    const [_, startTransition] = useTransition(); 
    const latestRequestRef = useRef(0);
    const likeControls = useAnimationControls();
    const dislikeControls = useAnimationControls();

    const [optimisticVotes, setOptimisticVotes] = useOptimistic(initialVotes, (state, newVote: { voteType: VoteType; userId: string }) => {
        const existingVoteIndex = state.findIndex(v => v.userId === newVote.userId);
        if (existingVoteIndex > -1) {
            const existingVote = state[existingVoteIndex];
            if (existingVote.type === newVote.voteType) { return state.filter(v => v.userId !== newVote.userId); } 
            else { return state.map(v => v.userId === newVote.userId ? { ...v, type: newVote.voteType } : v); }
        } else { return [...state, { userId: newVote.userId, type: newVote.voteType }]; }
    });

    const likes = optimisticVotes.filter(v => v.type === 'LIKE').length;
    const dislikes = optimisticVotes.filter(v => v.type === 'DISLIKE').length;
    const currentUserVote = optimisticVotes.find(v => v.userId === (session?.user as any)?.id)?.type;

    const handleVote = (voteType: VoteType) => {
        const userId = (session?.user as any)?.id;
        if (!userId) { setSignInModalOpen(true); return; }

        const requestId = ++latestRequestRef.current;
        
        if (voteType === 'LIKE') {
            likeControls.start("active");
        } else {
            dislikeControls.start("active");
        }
        
        startTransition(() => {
            setOptimisticVotes({ voteType, userId });
        });

        voteOnComment(commentId, voteType).then(result => {
            if (requestId === latestRequestRef.current && result.success && result.updatedVotes) {
                onVoteUpdate(commentId, result.updatedVotes);
            }
        });
    };

    return (
        <div className={styles.commentVoteActions}>
            <motion.button 
                className={`${styles.voteButton} ${currentUserVote === 'LIKE' ? styles.active : ''}`} 
                onClick={() => handleVote(VoteType.LIKE)} 
                whileTap={{ scale: 0.9 }} 
                variants={buttonVariants} 
                initial={currentUserVote === 'LIKE' ? 'active' : 'inactive'}
                animate={likeControls}
            >
                <ThumbsUpIcon isActive={currentUserVote === 'LIKE'} />
                <motion.span key={likes} variants={countVariants} initial="initial" animate="animate" exit="exit">{likes}</motion.span>
            </motion.button>
            <motion.button 
                className={`${styles.voteButton} ${currentUserVote === 'DISLIKE' ? styles.active : ''}`} 
                onClick={() => handleVote(VoteType.DISLIKE)} 
                whileTap={{ scale: 0.9 }} 
                variants={buttonVariants}
                initial={currentUserVote === 'DISLIKE' ? 'active' : 'inactive'}
                animate={dislikeControls}
            >
                <ThumbsDownIcon isActive={currentUserVote === 'DISLIKE'} />
                <motion.span key={dislikes} variants={countVariants} initial="initial" animate="animate" exit="exit">{dislikes}</motion.span>
            </motion.button>
        </div>
    );
}





