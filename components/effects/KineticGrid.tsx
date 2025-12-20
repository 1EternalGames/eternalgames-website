// components/effects/KineticGrid.tsx
'use client';

import React, { useRef, createContext, useContext } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styles from './KineticGrid.module.css';

// Create a context to pass motion values down to child cards
const KineticGridContext = createContext<{
    mouseX: any;
    mouseY: any;
} | null>(null);

export const useKineticGrid = () => {
    const context = useContext(KineticGridContext);
    if (!context) {
        throw new Error('useKineticGrid must be used within a KineticGrid provider');
    }
    return context;
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const KineticGrid = ({ children }: { children: React.ReactNode }) => {
    const gridRef = useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
    const smoothMouseX = useSpring(mouseX, springConfig);
    const smoothMouseY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(smoothMouseY, [0, 1], ['12deg', '-12deg']);
    const rotateY = useTransform(smoothMouseX, [0, 1], ['-12deg', '12deg']);
    const scale = useSpring(1, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gridRef.current) return;
        const { left, top, width, height } = gridRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - left) / width);
        mouseY.set((e.clientY - top) / height);
    };

    const handleMouseEnter = () => {
        scale.set(1.02);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
        scale.set(1);
    };

    return (
        <KineticGridContext.Provider value={{ mouseX, mouseY }}>
            <motion.div
                ref={gridRef}
                className={styles.perspectiveContainer}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    scale
                }}
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="content-grid">
                    {children}
                </div>
            </motion.div>
        </KineticGridContext.Provider>
    );
};


