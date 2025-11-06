'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      <motion.div
        key={pathname}
        // All animation props are removed. This component now only manages presence.
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}