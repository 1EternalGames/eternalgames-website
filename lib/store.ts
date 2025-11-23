// lib/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setBookmarkAction, setLikeAction, recordShareAction } from '@/app/actions/contentActions';
import useToastStore from './toastStore';

const createContentKey = (id: number, type: string) => `${type}-${id}`;

const debounceTimers: { [key: string]: NodeJS.Timeout } = {};

const initialState = {
    bookmarks: [] as string[],
    likes: [] as string[],
    shares: [] as string[],
    isSignInModalOpen: false,
    isSyncedWithDb: false,
};

type UserState = typeof initialState & { _hasHydrated: boolean };

type UserActions = {
    toggleBookmark: (contentId: number, contentType: string) => void;
    setSignInModalOpen: (isOpen: boolean) => void;
    toggleLike: (contentId: number, contentType: string, contentSlug: string) => void;
    addShare: (contentId: number, contentType: string, contentSlug: string) => void;
    syncWithDb: (dbData: { 
        likes: string[],
        bookmarks: string[],
        shares: string[]
    }) => void;
    setIsSyncedWithDb: (isSynced: boolean) => void;
    reset: () => void;
};

export const useUserStore = create<UserState & UserActions>()(
    persist(
        (set, get) => ({
            ...initialState,
            _hasHydrated: false,

            toggleBookmark: (contentId, contentType) => {
                const key = createContentKey(contentId, contentType);
                const originalBookmarks = get().bookmarks;
                const isCurrentlyBookmarked = originalBookmarks.includes(key);
                const finalState = !isCurrentlyBookmarked;

                if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
                
                set({ bookmarks: finalState ? [...originalBookmarks, key] : originalBookmarks.filter(k => k !== key) });

                debounceTimers[key] = setTimeout(async () => {
                    try {
                        const result = await setBookmarkAction(contentId, contentType, finalState);
                        if (!result.success) throw new Error(result.error);
                    } catch (error) {
                        useToastStore.getState().addToast('فشل الحفظ.', 'error');
                        set({ bookmarks: originalBookmarks });
                    }
                }, 500);
            },
            
            setSignInModalOpen: (isOpen: boolean) => set({ isSignInModalOpen: isOpen }),

            toggleLike: (contentId, contentType, contentSlug) => {
                const key = createContentKey(contentId, contentType);
                const originalLikes = get().likes;
                const isCurrentlyLiked = originalLikes.includes(key);
                const finalState = !isCurrentlyLiked;

                if (debounceTimers[key]) clearTimeout(debounceTimers[key]);

                set({ likes: finalState ? [...originalLikes, key] : originalLikes.filter(k => k !== key) });
                
                debounceTimers[key] = setTimeout(async () => {
                    try {
                        const result = await setLikeAction(contentId, contentType, contentSlug, finalState);
                        if (!result.success) throw new Error(result.error);
                    } catch (error) {
                        useToastStore.getState().addToast('أخفق تسجيل الإعجاب.', 'error');
                        set({ likes: originalLikes });
                    }
                }, 500);
            },

            addShare: async (contentId, contentType, contentSlug) => {
                const key = createContentKey(contentId, contentType);
                if (get().shares.includes(key)) return;
                set(state => ({ shares: [...state.shares, key] }));
                const result = await recordShareAction(contentId, contentType, contentSlug);
                if (result.success && result.shares) {
                    set({ shares: result.shares.map((s: any) => createContentKey(s.contentId, s.contentType)) });
                }
            },

            // OPTIMIZED: Directly accept arrays of string keys
            syncWithDb: (dbData) => {
                set({ 
                    likes: dbData.likes, 
                    bookmarks: dbData.bookmarks, 
                    shares: dbData.shares 
                });
            },

            setIsSyncedWithDb: (isSynced: boolean) => set({ isSyncedWithDb: isSynced }),
            reset: () => set(initialState),
        }),
        {
            name: 'eternalgames-user-preferences-v3',
            onRehydrateStorage: () => (state) => { if (state) { state._hasHydrated = true; } },
            partialize: (state) => ({
                bookmarks: state.bookmarks,
                likes: state.likes,
                shares: state.shares,
            }),
        }
    )
);