// app/template.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    // AnimatePresence is essential for shared layout animations.
    // The direct child motion.div should NOT have its own conflicting animations
    // (initial, animate, exit) as it will interfere with the layoutId transition.
    // It only needs the `key` to identify when a page change occurs.
    <AnimatePresence mode="popLayout">
      <motion.div key={pathname}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}