// components/ui/SmoothScrolling.tsx
'use client';

import { ReactLenis } from 'lenis/react';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useEffect, useState } from 'react';

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  // FIXED: Property now exists in the store interface
  const isEnabled = usePerformanceStore((state) => state.isSmoothScrollingEnabled);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Rehydrate store on mount
    usePerformanceStore.persist.rehydrate();
    setMounted(true);
  }, []);

  // If not mounted or disabled, render native scrolling
  if (!mounted || !isEnabled) {
    return <>{children}</>;
  }
  
  // FIXED: Explicitly cast 'vertical' strings to the specific type expected by LenisOptions
  // or cast the whole object to any if the types are strict.
  const lenisOptions = {
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical' as const, // Fixes type error
    gestureOrientation: 'vertical' as const, // Fixes type error
    wheelMultiplier: 1,
    smoothWheel: true,
    touchMultiplier: 2,
    smoothTouch: false,
  };

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}