// lib/performanceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Tier 5 = Ultra (All UI FX On)
// Tier 4 = High (Glass Off)
// Tier 3 = Medium (Glass Off, BG Off)
// Tier 2 = Low (Glass Off, BG Off, Living Off)
// Tier 1 = Potato (Glass Off, BG Off, Living Off, Tags Off)
// Tier 0 = Abyssal (Everything Off)
export type PerformanceTier = 0 | 1 | 2 | 3 | 4 | 5;

interface PerformanceState {
  // Toggles
  isLivingCardEnabled: boolean;
  isFlyingTagsEnabled: boolean;
  isHeroTransitionEnabled: boolean;
  isCornerAnimationEnabled: boolean;
  isHoverDebounceEnabled: boolean;
  isSmoothScrollingEnabled: boolean; // NEW
  
  // Background
  isBackgroundAnimated: boolean;
  isBackgroundVisible: boolean;

  // Rendering
  isGlassmorphismEnabled: boolean;
  
  // Automation
  isAutoTuningEnabled: boolean;

  // Actions
  toggleLivingCard: () => void;
  toggleFlyingTags: () => void;
  toggleHeroTransition: () => void;
  toggleCornerAnimation: () => void;
  toggleHoverDebounce: () => void;
  toggleSmoothScrolling: () => void; // NEW
  
  toggleBackgroundAnimation: () => void;
  toggleBackgroundVisibility: () => void;
  setBackgroundVisibility: (visible: boolean) => void; // NEW: For AutoTuner mobile override
  toggleGlassmorphism: () => void;
  
  toggleAutoTuning: () => void;
  
  // Used by Auto-Tuner
  setPerformanceTier: (tier: PerformanceTier) => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      // --- DEFAULTS ---
      isLivingCardEnabled: true,
      isFlyingTagsEnabled: true,
      isHeroTransitionEnabled: true,
      isCornerAnimationEnabled: true,
      isGlassmorphismEnabled: true,
      isHoverDebounceEnabled: true,
      
      isBackgroundVisible: true,
      isBackgroundAnimated: false,
      isSmoothScrollingEnabled: false, // Default OFF as requested
      
      isAutoTuningEnabled: true,

      // Manual toggles disable Auto-Tuning to respect user choice
      toggleLivingCard: () => set((state) => ({ isLivingCardEnabled: !state.isLivingCardEnabled, isAutoTuningEnabled: false })),
      toggleFlyingTags: () => set((state) => ({ isFlyingTagsEnabled: !state.isFlyingTagsEnabled, isAutoTuningEnabled: false })),
      toggleHeroTransition: () => set((state) => ({ isHeroTransitionEnabled: !state.isHeroTransitionEnabled, isAutoTuningEnabled: false })),
      toggleCornerAnimation: () => set((state) => ({ isCornerAnimationEnabled: !state.isCornerAnimationEnabled, isAutoTuningEnabled: false })),
      toggleHoverDebounce: () => set((state) => ({ isHoverDebounceEnabled: !state.isHoverDebounceEnabled, isAutoTuningEnabled: false })),
      toggleSmoothScrolling: () => set((state) => ({ isSmoothScrollingEnabled: !state.isSmoothScrollingEnabled, isAutoTuningEnabled: false })), // NEW
      
      toggleBackgroundAnimation: () => set((state) => ({ isBackgroundAnimated: !state.isBackgroundAnimated, isAutoTuningEnabled: false })),
      toggleBackgroundVisibility: () => set((state) => ({ isBackgroundVisible: !state.isBackgroundVisible, isAutoTuningEnabled: false })),
      setBackgroundVisibility: (visible: boolean) => set({ isBackgroundVisible: visible }), // Does NOT disable auto-tuning (used by auto-tuner itself)

      toggleGlassmorphism: () => set((state) => ({ isGlassmorphismEnabled: !state.isGlassmorphismEnabled, isAutoTuningEnabled: false })),
      
      toggleAutoTuning: () => set((state) => ({ isAutoTuningEnabled: !state.isAutoTuningEnabled })),

      setPerformanceTier: (tier: PerformanceTier) => set((state) => {
          // IMPORTANT: We do NOT touch isBackgroundAnimated or isSmoothScrollingEnabled here.
          // Smooth Scrolling remains OFF unless manually toggled (User request).
          switch (tier) {
              case 5: // ULTRA
                  return {
                      isGlassmorphismEnabled: true, isBackgroundVisible: true, isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true, isCornerAnimationEnabled: true, isHoverDebounceEnabled: false,
                  };
              case 4: // HIGH
                  return {
                      isGlassmorphismEnabled: false, isBackgroundVisible: true, isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true, isCornerAnimationEnabled: true, isHoverDebounceEnabled: false,
                  };
              case 3: // MEDIUM
                  return {
                      isGlassmorphismEnabled: false, isBackgroundVisible: false, isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true, isCornerAnimationEnabled: true, isHoverDebounceEnabled: true,
                  };
              case 2: // LOW
                  return {
                      isGlassmorphismEnabled: false, isBackgroundVisible: false, isLivingCardEnabled: false,
                      isFlyingTagsEnabled: true, isCornerAnimationEnabled: true, isHoverDebounceEnabled: true,
                  };
              case 1: // POTATO
                  return {
                      isGlassmorphismEnabled: false, isBackgroundVisible: false, isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, isCornerAnimationEnabled: true, isHoverDebounceEnabled: true,
                  };
              case 0: // ABYSSAL
                  return {
                      isGlassmorphismEnabled: false, isBackgroundVisible: false, isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, isCornerAnimationEnabled: false, isHoverDebounceEnabled: true,
                  };
              default:
                  return state;
          }
      })
    }),
    {
      name: 'eternalgames-performance-settings',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);