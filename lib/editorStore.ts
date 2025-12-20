// lib/editorStore.ts
import { create } from 'zustand';
import { UploadQuality } from '@/lib/image-optimizer';

interface EditorState {
  isEditorActive: boolean;
  liveUrl: string | null;
  blockUploadQuality: UploadQuality;
  setEditorActive: (isActive: boolean) => void;
  setLiveUrl: (url: string | null) => void;
  setBlockUploadQuality: (quality: UploadQuality) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isEditorActive: false,
  liveUrl: null,
  blockUploadQuality: '1080p',
  setEditorActive: (isActive) => set({ isEditorActive: isActive }),
  setLiveUrl: (url) => set({ liveUrl: url }),
  setBlockUploadQuality: (quality) => set({ blockUploadQuality: quality }),
}));


