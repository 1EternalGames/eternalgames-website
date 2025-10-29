// components/ActionButton.tsx
'use client';

import { motion } from 'framer-motion';
import React from 'react';
import styles from './ActionButton.module.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    'aria-label': string;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
    ({ children, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                className={styles.actionButton}
                whileTap={{ scale: 0.9, y: 0 }}
                whileHover={{ scale: 1.15, y: 0 }}
                // --- THE FIX: Use an instantaneous tween/duration for immediate feel ---
                transition={{ duration: 0.05, ease: "easeInOut" as const }}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);

ActionButton.displayName = 'ActionButton';
export default ActionButton;