// lib/rippleStore.ts
import { create } from 'zustand';

type Ripple = {
  id: number;
  x: number;
  y: number;
};

interface RippleState {
  ripples: Ripple[];
  addRipple: (x: number, y: number) => void;
  removeRipple: (id: number) => void;
}

export const useRippleStore = create<RippleState>((set) => ({
  ripples: [],
  addRipple: (x, y) => {
    const newRipple = { id: Date.now(), x, y };
    set((state) => ({ ripples: [...state.ripples, newRipple] }));
  },
  removeRipple: (id) => {
    set((state) => ({ ripples: state.ripples.filter((r) => r.id !== id) }));
  },
}));


