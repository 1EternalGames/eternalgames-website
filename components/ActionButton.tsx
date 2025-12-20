// components/ActionButton.tsx
'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import styles from './ActionButton.module.css';

// THE DEFINITIVE FIX: Create a more precise props type that omits conflicting properties.
type ConflictingProps = 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag';
interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps> {
    children: React.ReactNode;
    'aria-label': string;
}

const ActionButton = ({ children, ...props }: ActionButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            className={styles.actionButton}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ scale: isHovered ? 1.15 : 1 }}
            whileTap={{ scale: 0.9, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default ActionButton;


