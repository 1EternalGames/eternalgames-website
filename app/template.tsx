// app/template.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    // AnimatePresence is still required to orchestrate the exit of old components
    // and the entry of new ones, which is critical for layoutId.
    <AnimatePresence mode="popLayout">
      {/* 
        THE DEFINITIVE FIX:
        The page-level fade-in props (initial, animate, transition) have been REMOVED.
        These were conflicting with the more specific layoutId animations, causing rendering bugs.
        Now, this motion.div serves only as a keyed container for AnimatePresence,
        allowing the actual components with layoutId to handle their own transitions seamlessly.
      */}
      <motion.div key={pathname}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}