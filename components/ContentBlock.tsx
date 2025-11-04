// components/ContentBlock.tsx
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
            staggerChildren: 0.1, // Faster stagger between title and body
        },
    },
};

const titleContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06, // Stagger between icon and words
            delayChildren: 0.3, // Wait for border to draw
        },
    },
};

const borderVariant = {
    hidden: { scaleY: 0 },
    visible: { scaleY: 1, transition: { duration: 0.4, ease: [0.6, 0.01, -0.05, 0.95] } }
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
                <motion.div className={styles.contentBlockTitle_before} variants={borderVariant} style={{'--pseudo-selector': '::before'} as any} />
                <motion.div className={styles.contentBlockTitle_after} variants={borderVariant} style={{'--pseudo-selector': '::after'} as any} />
                
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