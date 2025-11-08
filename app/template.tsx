// app/template.tsx
'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // The 'exit' prop, which caused the conflict with layoutId animations, has been removed.
        // This allows the component-level layout animations to handle the transition exclusively,
        // resolving the bug where cards would become invisible upon navigating back.
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
  );
}