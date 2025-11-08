// components/ScoreBox.tsx
'use client';

import React, { useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { CheckIcon, CancelIcon } from '@/components/icons/index';
import styles from './ScoreBox.module.css';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.25, delayChildren: 0.2 }, }, };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }, };

const ScoreBoxComponent = ({ review, className }: { review: any, className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <motion.div ref={ref} className={`${styles.scoreBox} ${className || ''}`} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={containerVariants}>
            <svg className={styles.scoreBoxBorder} width="100%" height="100%">
                <motion.rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="12" stroke="var(--accent)" strokeWidth="2" fill="transparent" initial={{ pathLength: 0 }} animate={{ pathLength: isInView ? 1 : 0 }} transition={{ duration: 1, ease: 'easeInOut' }} />
            </svg>
            <AnimatedNumber value={review.score} isInView={isInView} className={styles.scoreBoxScore} />
            <motion.div variants={itemVariants} className={styles.scoreBoxVerdictLabel}>الخلاصة</motion.div>
            <motion.p variants={itemVariants} className={styles.scoreBoxVerdictText}>{review.verdict}</motion.p>
            <motion.div variants={itemVariants} className={styles.scoreBoxDivider} />
            <div className={styles.scoreBoxProsCons}>
                <motion.div variants={itemVariants}>
                    <h4>المحاسن</h4>
                    <ul>{review.pros.map((pro: string, index: number) => (<li key={`pro-${index}`}>{pro} <CheckIcon style={{flexShrink:0,width:'3.5rem',height:'3.5rem',marginTop:'-0.3rem',color:'#16A34A'}} /></li>))}</ul>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <h4>المآخذ</h4>
                    <ul>{review.cons.map((con: string, index: number) => (<li key={`con-${index}`}>{con} <CancelIcon style={{flexShrink:0,width:'1.8rem',height:'1.8rem',marginTop:'0.6rem',color:'#DC2626'}} /></li>))}</ul>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default memo(ScoreBoxComponent);