// components/PageTransitionWrapper.tsx
'use client';

import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // OPTIMIZATION: Enable LazyMotion to reduce initial bundle size
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </LazyMotion>
  );
}