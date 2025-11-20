// components/PageTransitionWrapper.tsx
'use client';

import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <m.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}