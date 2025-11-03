// lib/lightboxStore.ts
import { create } from 'zustand';

interface LightboxState {
  isOpen: boolean;
  imageUrls: string[];
  currentIndex: number;
  openLightbox: (urls: string[], startIndex: number) => void;
  closeLightbox: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
}

export const useLightboxStore = create<LightboxState>((set, get) => ({
  isOpen: false,
  imageUrls: [],
  currentIndex: 0,
  openLightbox: (urls, startIndex = 0) => set({ 
    isOpen: true, 
    imageUrls: urls,
    currentIndex: startIndex 
  }),
  closeLightbox: () => set({ 
    isOpen: false, 
    imageUrls: [], 
    currentIndex: 0 
  }),
  goToNext: () => {
    const { imageUrls, currentIndex } = get();
    if (imageUrls.length > 1) {
      const nextIndex = (currentIndex + 1) % imageUrls.length;
      set({ currentIndex: nextIndex });
    }
  },
  goToPrevious: () => {
    const { imageUrls, currentIndex } = get();
    if (imageUrls.length > 1) {
      const prevIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
      set({ currentIndex: prevIndex });
    }
  },
}));


