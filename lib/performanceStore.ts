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
  
  toggleBackgroundAnimation: () => void;
  toggleBackgroundVisibility: () => void;
  toggleGlassmorphism: () => void;
  
  toggleAutoTuning: () => void;
  
  // Used by Auto-Tuner
  setPerformanceTier: (tier: PerformanceTier) => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      // --- DEFAULTS ---
      // UI FX: All ON by default
      isLivingCardEnabled: true,
      isFlyingTagsEnabled: true,
      isHeroTransitionEnabled: true,
      isCornerAnimationEnabled: true,
      isGlassmorphismEnabled: true,
      
      // Background: ON by default (User requested "default everything turned on")
      isBackgroundVisible: true,
      
      // Animation: OFF by default (Explicit request: "animation will always be turned off until the user turn it on")
      isBackgroundAnimated: false,
      
      // Auto-Tuning: ON by default
      isAutoTuningEnabled: true,

      // Manual toggles disable Auto-Tuning to respect user choice
      toggleLivingCard: () => set((state) => ({ isLivingCardEnabled: !state.isLivingCardEnabled, isAutoTuningEnabled: false })),
      toggleFlyingTags: () => set((state) => ({ isFlyingTagsEnabled: !state.isFlyingTagsEnabled, isAutoTuningEnabled: false })),
      toggleHeroTransition: () => set((state) => ({ isHeroTransitionEnabled: !state.isHeroTransitionEnabled, isAutoTuningEnabled: false })),
      toggleCornerAnimation: () => set((state) => ({ isCornerAnimationEnabled: !state.isCornerAnimationEnabled, isAutoTuningEnabled: false })),
      
      toggleBackgroundAnimation: () => set((state) => ({ isBackgroundAnimated: !state.isBackgroundAnimated, isAutoTuningEnabled: false })),
      toggleBackgroundVisibility: () => set((state) => ({ isBackgroundVisible: !state.isBackgroundVisible, isAutoTuningEnabled: false })),
      toggleGlassmorphism: () => set((state) => ({ isGlassmorphismEnabled: !state.isGlassmorphismEnabled, isAutoTuningEnabled: false })),
      
      toggleAutoTuning: () => set((state) => ({ isAutoTuningEnabled: !state.isAutoTuningEnabled })),

      setPerformanceTier: (tier: PerformanceTier) => set((state) => {
          // IMPORTANT: We do NOT touch isBackgroundAnimated. It is purely manual.
          switch (tier) {
              case 5: // ULTRA: Everything ON
                  return {
                      isGlassmorphismEnabled: true,
                      isBackgroundVisible: true,
                      isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true,
                      isCornerAnimationEnabled: true
                  };
              case 4: // HIGH: Kill Glass (Heaviest UI effect)
                  return {
                      isGlassmorphismEnabled: false,
                      isBackgroundVisible: true,
                      isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true,
                      isCornerAnimationEnabled: true
                  };
              case 3: // MEDIUM: Kill Background Visibility (Heavy DOM)
                  return {
                      isGlassmorphismEnabled: false,
                      isBackgroundVisible: false,
                      isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true,
                      isCornerAnimationEnabled: true
                  };
              case 2: // LOW: Kill Living Cards (JS Overhead)
                  return {
                      isGlassmorphismEnabled: false,
                      isBackgroundVisible: false,
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: true,
                      isCornerAnimationEnabled: true
                  };
              case 1: // POTATO: Kill Flying Tags (Physics)
                  return {
                      isGlassmorphismEnabled: false,
                      isBackgroundVisible: false,
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false,
                      isCornerAnimationEnabled: true
                  };
              case 0: // ABYSSAL: Kill Corners (Minimal)
                  return {
                      isGlassmorphismEnabled: false,
                      isBackgroundVisible: false,
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false,
                      isCornerAnimationEnabled: false
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