// components/PageTransitionWrapper.tsx
'use client';

import { m, AnimatePresence, LazyMotion, domAnimation, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { useLayoutIdStore } from '@/lib/layoutIdStore';

// Standard fade/slide transition for pages that don't share layoutIds
const pageVariants: Variants = {
    initial: { 
        opacity: 0, 
        y: 20,
        scale: 0.98
    },
    animate: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier for smooth entry
            when: "beforeChildren" 
        }
    },
    exit: { 
        opacity: 0, 
        y: -20, 
        scale: 0.98,
        transition: {
            duration: 0.3,
            ease: "easeIn" 
        }
    }
};

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setPrefix } = useLayoutIdStore();
  
  // We use a ref to track the previous path to determine transition direction if needed,
  // though for now, a standard cross-fade works best for layoutId.
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
        // When path changes, we don't immediately reset the prefix.
        // The prefix (e.g., "vanguard-reviews") is needed during the exit/enter phase
        // for the layoutId match to occur.
        // We let the individual page components handle the cleanup via their useEffects.
        prevPath.current = pathname;
    }
  }, [pathname, setPrefix]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          style={{ 
            width: '100%', 
            position: 'relative',
            // Ensure the container doesn't clip the expanding card
            zIndex: 1 
          }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}