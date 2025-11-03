// components/AnimatedGridBackground.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedGridBackground() {
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        '--grid-size': '60px',
        '--grid-color': 'rgba(125, 128, 140, 0.1)',
        backgroundImage:
          'linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)',
        backgroundSize: 'var(--grid-size) var(--grid-size)',
      } as React.CSSProperties}
      animate={{
        backgroundPosition: ['0px 0px', 'var(--grid-size) var(--grid-size)'],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}


