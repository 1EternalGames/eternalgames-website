// components/PageTransitionWrapper.tsx
'use client';

import React from 'react';

// This component has been neutralized to prevent conflict with app/template.tsx.
// It now acts as a simple pass-through, which is safer than removing it 
// and potentially breaking imports in layout.tsx.
export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
        {children}
    </>
  );
}