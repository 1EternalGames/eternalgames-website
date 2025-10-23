// lib/lightboxStore.ts
import { create } from 'zustand';

interface LightboxState {
  isOpen: boolean;
  imageUrl: string | null;
  openLightbox: (url: string) => void;
  closeLightbox: () => void;
}

export const useLightboxStore = create<LightboxState>((set) => ({
  isOpen: false,
  imageUrl: null,
  openLightbox: (url) => set({ isOpen: true, imageUrl: url }),
  closeLightbox: () => set({ isOpen: false, imageUrl: null }),
}));