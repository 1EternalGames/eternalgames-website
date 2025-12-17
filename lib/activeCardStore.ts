import { create } from 'zustand';

interface ActiveCardState {
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
}

export const useActiveCardStore = create<ActiveCardState>((set) => ({
  activeCardId: null,
  setActiveCardId: (id) => set({ activeCardId: id }),
}));