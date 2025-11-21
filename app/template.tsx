// app/template.tsx
'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  // We keep the pathname to force a re-render of the motion div on route change
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // We remove AnimatePresence and popLayout to prevent the 
      // previous page from getting "stuck" in the DOM during production builds.
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ width: '100%' }} // Ensure it takes full width
    >
      {children}
    </motion.div>
  );
}