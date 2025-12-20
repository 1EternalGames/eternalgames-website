// lib/scrollStore.ts
import { create } from 'zustand';

interface ScrollState {
  scrollPos: number;
  setScrollPos: (pos: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollPos: 0,
  setScrollPos: (pos) => set({ scrollPos: pos }),
}));


