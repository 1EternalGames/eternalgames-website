// app/template.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    // AnimatePresence with mode="popLayout" is essential for shared layout animations.
    // The direct child motion.div must NOT have an `exit` prop. A conflicting
    // exit animation on the parent wrapper causes the source element to fade out before
    // Framer Motion can calculate the transform, breaking the animation's origin point.
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // EXIT PROP REMOVED TO FIX THE LAYOUTID CONFLICT
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
