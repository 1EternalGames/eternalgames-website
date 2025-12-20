// lib/layoutIdStore.ts
import { create } from 'zustand';

interface LayoutIdState {
    prefix: string;
    setPrefix: (prefix: string) => void;
}

export const useLayoutIdStore = create<LayoutIdState>((set) => ({
    prefix: 'default',
    setPrefix: (prefix) => set({ prefix }),
}));








