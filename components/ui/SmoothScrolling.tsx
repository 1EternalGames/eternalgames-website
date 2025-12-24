// components/ui/SmoothScrolling.tsx
'use client';

import { ReactLenis } from 'lenis/react';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useEffect, useState } from 'react';

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
  // Access store to check if enabled
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
  
  // Physics-based easing for premium feel
  const lenisOptions = {
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    wheelMultiplier: 1,
    smoothWheel: true,
    touchMultiplier: 2,
    smoothTouch: false, // Disable on touch devices natively inside Lenis too
  };

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}