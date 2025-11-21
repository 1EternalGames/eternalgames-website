// components/PageTransitionWrapper.tsx
'use client';

import React from 'react';

// MODIFIED: Removed AnimatePresence and motion.div to resolve nested animation conflict.
// This component now acts as a simple pass-through wrapper.
// The actual page transition logic is handled in app/template.tsx.
export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}