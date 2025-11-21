// app/template.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        // Slower, heavier transition to allow the eye to follow the card
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} // Custom bezier for smooth landing
        style={{ 
            isolation: 'isolate', 
            width: '100%', 
            // Ensure the container covers the screen to prevent black flashes
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            // Ensure it sits on top/correctly in the stack
            position: 'relative',
            zIndex: 1
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}