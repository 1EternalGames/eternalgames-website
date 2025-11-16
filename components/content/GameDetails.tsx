// components/content/GameDetails.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './GameDetails.module.css';

type Detail = {
  label: string;
  value: string;
};

interface GameDetailsProps {
  details: Detail[];
}

const isRTL = (s: string) => {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(s);
};

// Animation Variants for Game Details
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12, // Stagger each row
            delayChildren: 0.2,
        },
    },
};

const rowVariants = {
    hidden: { opacity: 0, x: -30 }, // Slide in from the left
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring' as const, // THE DEFINITIVE FIX: Explicitly cast the type
            stiffness: 200,
            damping: 25,
        },
    },
};

export default function GameDetails({ details }: GameDetailsProps) {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, amount: 0.4 });

    if (!details || details.length === 0) {
        return null;
    }

    return (
        <motion.div
            ref={containerRef}
            className={styles.detailsContainer}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
        >
            {details.map((detail, index) => (
                <motion.div key={index} className={styles.detailRow} variants={rowVariants}>
                    <span className={styles.detailLabel}>{detail.label}</span>
                    <span
                        className={styles.detailValue}
                        dir={isRTL(detail.value) ? 'rtl' : 'ltr'}
                    >
                        {detail.value}
                    </span>
                </motion.div>
            ))}
        </motion.div>
    );
}