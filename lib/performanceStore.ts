// lib/performanceStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PerformanceTier = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface PerformanceState {
  // Toggles
  isLivingCardEnabled: boolean;
  isFlyingTagsEnabled: boolean;
  isHeroTransitionEnabled: boolean;
  isCornerAnimationEnabled: boolean;
  isHoverDebounceEnabled: boolean;
  isCarouselAutoScrollEnabled: boolean;
  isSmoothScrollingEnabled: boolean; 
  
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
  toggleCarouselAutoScroll: () => void;
  toggleSmoothScrolling: () => void; 
  
  toggleBackgroundAnimation: () => void;
  toggleBackgroundVisibility: () => void;
  toggleGlassmorphism: () => void;
  
  toggleAutoTuning: () => void;
  
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
      isCarouselAutoScrollEnabled: true,
      isSmoothScrollingEnabled: false, // Default OFF
      
      // Default: Visible (Image), but NOT Animated (SVG)
      isBackgroundVisible: true,
      isBackgroundAnimated: false, 
      isAutoTuningEnabled: true,

      // Manual toggles disable Auto-Tuning to respect user choice
      toggleLivingCard: () => set((state) => ({ isLivingCardEnabled: !state.isLivingCardEnabled, isAutoTuningEnabled: false })),
      toggleFlyingTags: () => set((state) => ({ isFlyingTagsEnabled: !state.isFlyingTagsEnabled, isAutoTuningEnabled: false })),
      toggleHeroTransition: () => set((state) => ({ isHeroTransitionEnabled: !state.isHeroTransitionEnabled, isAutoTuningEnabled: false })),
      toggleCornerAnimation: () => set((state) => ({ isCornerAnimationEnabled: !state.isCornerAnimationEnabled, isAutoTuningEnabled: false })),
      toggleHoverDebounce: () => set((state) => ({ isHoverDebounceEnabled: !state.isHoverDebounceEnabled, isAutoTuningEnabled: false })),
      toggleCarouselAutoScroll: () => set((state) => ({ isCarouselAutoScrollEnabled: !state.isCarouselAutoScrollEnabled, isAutoTuningEnabled: false })),
      
      // Smooth Scrolling does NOT disable auto-tuning because it is a personal preference outside the tier system now
      toggleSmoothScrolling: () => set((state) => ({ isSmoothScrollingEnabled: !state.isSmoothScrollingEnabled })), 
      
      toggleBackgroundAnimation: () => set((state) => ({ isBackgroundAnimated: !state.isBackgroundAnimated, isAutoTuningEnabled: false })),
      toggleBackgroundVisibility: () => set((state) => ({ isBackgroundVisible: !state.isBackgroundVisible, isAutoTuningEnabled: false })),
      toggleGlassmorphism: () => set((state) => ({ isGlassmorphismEnabled: !state.isGlassmorphismEnabled, isAutoTuningEnabled: false })),
      
      toggleAutoTuning: () => set((state) => ({ isAutoTuningEnabled: !state.isAutoTuningEnabled })),

      setPerformanceTier: (tier: PerformanceTier) => set((state) => {
          // IMPORTANT: We do NOT touch isBackgroundAnimated or isSmoothScrollingEnabled here.
          // They are purely manual preferences.
          switch (tier) {
              case 6: // ULTRA
                  return {
                      isGlassmorphismEnabled: true, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true, 
                      isCornerAnimationEnabled: true, 
                      isHoverDebounceEnabled: false, 
                      isCarouselAutoScrollEnabled: true,
                  };
              case 5: // HIGH
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: true,
                      isFlyingTagsEnabled: true, 
                      isCornerAnimationEnabled: true, 
                      isHoverDebounceEnabled: false, 
                      isCarouselAutoScrollEnabled: true,
                  };
              case 4: // MEDIUM-HIGH
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: false, 
                      isFlyingTagsEnabled: true, 
                      isCornerAnimationEnabled: true, 
                      isHoverDebounceEnabled: false, 
                      isCarouselAutoScrollEnabled: true,
                  };
              case 3: // MEDIUM
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, 
                      isCornerAnimationEnabled: true, 
                      isHoverDebounceEnabled: false, 
                      isCarouselAutoScrollEnabled: true,
                  };
              case 2: // LOW
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, 
                      isCornerAnimationEnabled: false, 
                      isHoverDebounceEnabled: true, 
                      isCarouselAutoScrollEnabled: true,
                  };
              case 1: // POTATO
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: true, 
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, 
                      isCornerAnimationEnabled: false, 
                      isHoverDebounceEnabled: true, 
                      isCarouselAutoScrollEnabled: false, 
                  };
              case 0: // ABYSSAL
                  return {
                      isGlassmorphismEnabled: false, 
                      isBackgroundVisible: false, 
                      isLivingCardEnabled: false,
                      isFlyingTagsEnabled: false, 
                      isCornerAnimationEnabled: false, 
                      isHoverDebounceEnabled: true, 
                      isCarouselAutoScrollEnabled: false,
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