// components/ActionButton.tsx
'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';
import styles from './ActionButton.module.css';

// THE DEFINITIVE FIX: Create a more precise props type that omits conflicting properties.
type ConflictingProps = 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag';
interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps> {
    children: React.ReactNode;
    'aria-label': string;
}

const ActionButton = ({ children, ...props }: ActionButtonProps) => {
    return (
        <motion.button
            className={styles.actionButton}
            whileTap={{ scale: 0.9, y: 0 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default ActionButton; 