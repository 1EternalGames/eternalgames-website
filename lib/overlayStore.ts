import { create } from 'zustand';

interface OverlayState {
  isOpen: boolean;
  contentId: string | null; // The _id or slug to look up in ContentStore
  contentType: 'reviews' | 'articles' | 'news' | null;
  openOverlay: (id: string, type: 'reviews' | 'articles' | 'news') => void;
  closeOverlay: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isOpen: false,
  contentId: null,
  contentType: null,
  openOverlay: (id, type) => set({ isOpen: true, contentId: id, contentType: type }),
  closeOverlay: () => set({ isOpen: false, contentId: null, contentType: null }),
}));