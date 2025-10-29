// components/ScoreBox.tsx
'use client';

import React, { useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import styles from './ScoreBox.module.css';

const CheckIcon = () => ( <svg style={{flexShrink:0,width:'1.8rem',height:'1.8rem',marginTop:'0.2rem',color:'#16A34A'}} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg> );
const CrossIcon = () => ( <svg style={{flexShrink:0,width:'1.8rem',height:'1.8rem',marginTop:'0.2rem',color:'#DC2626'}} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg> );

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.25, delayChildren: 0.2 }, }, };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }, };

const ScoreBoxComponent = ({ review }: { review: any }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <motion.div ref={ref} className={styles.scoreBox} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={containerVariants}>
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
                    <ul>{review.pros.map((pro: string, index: number) => (<li key={`pro-${index}`}>{pro} <CheckIcon /></li>))}</ul>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <h4>المآخذ</h4>
                    <ul>{review.cons.map((con: string, index: number) => (<li key={`con-${index}`}>{con} <CrossIcon /></li>))}</ul>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default memo(ScoreBoxComponent);