'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './ContentBlock.module.css';

type ContentBlockProps = {
    title: string;
    children?: React.ReactNode;
    variant?: 'default' | 'fullbleed';
    Icon?: React.ComponentType<{ className?: string }>;
};

const blockVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.2, // Stagger between title and body
        },
    },
};

const titleContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06, // Stagger between icon and words
        },
    },
};

const titleIconVariant = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } }
};

const titleWordVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

const bodyVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: 'easeOut' as const,
            staggerChildren: 0.08,
        },
    },
};

export function ContentBlock({ title, children, variant = 'default', Icon }: ContentBlockProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    const blockClasses = `${styles.contentBlock} ${variant === 'fullbleed' ? styles.variantFullbleed : ''}`;

    return (
        <motion.section
            ref={ref}
            className={blockClasses}
            variants={blockVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
        >
            <motion.h2 className={styles.contentBlockTitle} variants={titleContainerVariants}>
                {Icon && (
                    <motion.div variants={titleIconVariant} style={{ display: 'flex' }}>
                        <Icon className={styles.titleIcon} />
                    </motion.div>
                )}
                <span style={{ display: 'inline-block' }}>
                    {title.split(' ').map((word, index) => (
                        <motion.span
                            key={index}
                            variants={titleWordVariant}
                            style={{ display: 'inline-block', marginRight: '0.7rem' }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </span>
            </motion.h2>
            {children && (
                <motion.div className={styles.contentBlockBody} variants={bodyVariants}>
                    {children}
                </motion.div>
            )}
        </motion.section>
    );
}