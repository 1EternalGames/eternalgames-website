// components/effects/KonamiCode.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePerformanceStore } from '@/lib/performanceStore';
import { useToast } from '@/lib/toastStore';

const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp', 
  'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 
  'ArrowLeft', 'ArrowRight', 
  'b', 'a'
];

export default function KonamiCode() {
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const { setPerformanceTier } = usePerformanceStore();
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add new key to history
      const newHistory = [...inputHistory, e.key];
      
      // Keep history length equal to sequence length
      if (newHistory.length > KONAMI_SEQUENCE.length) {
        newHistory.shift();
      }
      
      setInputHistory(newHistory);

      // Check if sequence matches
      if (JSON.stringify(newHistory) === JSON.stringify(KONAMI_SEQUENCE)) {
        // ACTIVATE GOD MODE
        setPerformanceTier(5); // Ultra Tier
        toast.success("🎮 GOD MODE ACTIVATED: Visuals maximized!", "right");
        
        // Play a little sound or effect here if desired? 
        // For now, let's just clear the history so they can do it again.
        setInputHistory([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputHistory, setPerformanceTier, toast]);

  return null;
}