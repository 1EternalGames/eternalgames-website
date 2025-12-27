// lib/uiStore.ts
import { create } from 'zustand';

interface UIState {
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
    
    // Reference to the active scroll container (Window or Overlay)
    // This allows the Navbar to react to the Overlay's scrolling
    overlayScrollRef: HTMLElement | null;
    setOverlayScrollRef: (ref: HTMLElement | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
    
    overlayScrollRef: null,
    setOverlayScrollRef: (ref) => set({ overlayScrollRef: ref }),
}));