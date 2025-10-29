// hooks/useContentFilters.ts
'use client';

import { useMemo } from 'react';
import { useEngagementScores } from '@/hooks/useEngagementScores';
import { adaptToCardProps } from '@/lib/adapters';
import type { SanityGame, SanityTag } from '@/types/sanity';
import type { CardProps } from '@/types';
import type { ScoreFilter } from '@/components/filters/ReviewFilters';
import type { HubTypeFilter } from '@/components/HubFilters';

export interface ContentFilters {
    sort?: 'latest' | 'score' | 'viral';
    type?: HubTypeFilter;
    scoreRange?: ScoreFilter;
    game?: SanityGame | null;
    tags?: SanityTag[];
    searchTerm?: string;
}

export function useContentFilters(initialItems: any[], filters: ContentFilters): CardProps[] {
    const engagementScores = useEngagementScores();

    return useMemo(() => {
        const scoresMap = new Map(engagementScores.map(s => [s.id, s.engagementScore]));
        let items = [...initialItems];

        if (filters.searchTerm) {
            items = items.filter(item => item.title.toLowerCase().includes(filters.searchTerm!.toLowerCase()));
        }
        
        if (filters.type && filters.type !== 'all') {
            items = items.filter(item => item._type === filters.type);
        }

        if (filters.game) {
            items = items.filter(item => item.game?._id === filters.game!._id);
        }

        if (filters.tags && filters.tags.length > 0) {
            const selectedTagIds = new Set(filters.tags.map(t => t._id));
            items = items.filter(item => 
                (item.tags || []).some((tag: any) => tag && selectedTagIds.has(tag._id))
            );
        }

        if (filters.scoreRange && filters.scoreRange !== 'All') {
            switch (filters.scoreRange) {
                case '9-10': items = items.filter(r => r.score >= 9 && r.score <= 10); break;
                case '8-8.9': items = items.filter(r => r.score >= 8 && r.score < 9); break;
                case '7-7.9': items = items.filter(r => r.score >= 7 && r.score < 8); break;
                case '<7': items = items.filter(r => r.score < 7); break;
            }
        }

        if (filters.sort === 'viral') {
            items.sort((a, b) => (scoresMap.get(b.legacyId) || 0) - (scoresMap.get(a.legacyId) || 0));
        } else if (filters.sort === 'score') {
            items.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else { // Default to 'latest'
            items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        }

        return items.map(adaptToCardProps).filter(Boolean) as CardProps[];

    }, [initialItems, filters, engagementScores]);
}