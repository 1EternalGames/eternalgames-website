// lib/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// THE FIX: Import the new idempotent actions
import { setBookmarkAction, setLikeAction, recordShareAction } from '@/app/actions/contentActions';
import { useToast } from './toastStore';

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
        engagements: { contentId: number, contentType: string, type: 'LIKE' | 'BOOKMARK' }[],
        shares: { contentId: number, contentType: string }[]
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

                // This is the final state the user wants.
                const finalState = !isCurrentlyBookmarked;

                if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
                
                // Perform the optimistic update immediately.
                set({ bookmarks: finalState ? [...originalBookmarks, key] : originalBookmarks.filter(k => k !== key) });

                // Debounce the server action, sending the FINAL state.
                debounceTimers[key] = setTimeout(async () => {
                    try {
                        const result = await setBookmarkAction(contentId, contentType, finalState);
                        if (!result.success) throw new Error(result.error);
                    } catch (error) {
                        useToast.getState().error('فشل حفظ العلامة المرجعية.');
                        set({ bookmarks: originalBookmarks });
                    }
                }, 500);
            },
            
            setSignInModalOpen: (isOpen: boolean) => set({ isSignInModalOpen: isOpen }),

            toggleLike: (contentId, contentType, contentSlug) => {
                const key = createContentKey(contentId, contentType);
                const originalLikes = get().likes;
                const isCurrentlyLiked = originalLikes.includes(key);

                // This is the final state the user wants.
                const finalState = !isCurrentlyLiked;

                if (debounceTimers[key]) clearTimeout(debounceTimers[key]);

                // Perform the optimistic update immediately.
                set({ likes: finalState ? [...originalLikes, key] : originalLikes.filter(k => k !== key) });
                
                // Debounce the server action, sending the FINAL state.
                debounceTimers[key] = setTimeout(async () => {
                    try {
                        const result = await setLikeAction(contentId, contentType, contentSlug, finalState);
                        if (!result.success) throw new Error(result.error);
                    } catch (error) {
                        useToast.getState().error('فشل تسجيل الإعجاب.');
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
                    set({ shares: result.shares.map(s => createContentKey(s.contentId, s.contentType)) });
                }
            },

            syncWithDb: (dbData) => {
                const dbLikes: string[] = [];
                const dbBookmarks: string[] = [];
                (dbData.engagements || []).forEach(engagement => {
                    const key = createContentKey(engagement.contentId, engagement.contentType);
                    if (engagement.type === 'LIKE') dbLikes.push(key);
                    else if (engagement.type === 'BOOKMARK') dbBookmarks.push(key);
                });
                const dbShares = (dbData.shares || []).map(s => createContentKey(s.contentId, s.contentType));
                set({ likes: dbLikes, bookmarks: dbBookmarks, shares: dbShares });
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


