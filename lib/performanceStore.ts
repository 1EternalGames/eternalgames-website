// lib/performanceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PerformanceState {
  isLivingCardEnabled: boolean;
  isFlyingTagsEnabled: boolean;
  isHeroTransitionEnabled: boolean;
  isCornerAnimationEnabled: boolean;
  
  // New Background Settings
  isBackgroundAnimated: boolean;
  isBackgroundVisible: boolean;
  
  toggleLivingCard: () => void;
  toggleFlyingTags: () => void;
  toggleHeroTransition: () => void;
  toggleCornerAnimation: () => void;
  
  toggleBackgroundAnimation: () => void;
  toggleBackgroundVisibility: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      // Default to high performance/fidelity
      isLivingCardEnabled: true,
      isFlyingTagsEnabled: true,
      isHeroTransitionEnabled: true,
      isCornerAnimationEnabled: true,
      
      // Default Background
      isBackgroundAnimated: false,
      // MODIFIED: Default to false on mobile devices to improve initial load performance
      isBackgroundVisible: typeof window !== 'undefined' ? window.innerWidth > 768 : true,

      toggleLivingCard: () => set((state) => ({ isLivingCardEnabled: !state.isLivingCardEnabled })),
      toggleFlyingTags: () => set((state) => ({ isFlyingTagsEnabled: !state.isFlyingTagsEnabled })),
      toggleHeroTransition: () => set((state) => ({ isHeroTransitionEnabled: !state.isHeroTransitionEnabled })),
      toggleCornerAnimation: () => set((state) => ({ isCornerAnimationEnabled: !state.isCornerAnimationEnabled })),
      
      toggleBackgroundAnimation: () => set((state) => ({ isBackgroundAnimated: !state.isBackgroundAnimated })),
      toggleBackgroundVisibility: () => set((state) => ({ isBackgroundVisible: !state.isBackgroundVisible })),
    }),
    {
      name: 'eternalgames-performance-settings',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);