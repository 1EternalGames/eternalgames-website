import * as THREE from 'three';
// Import the new Sanity types instead of the old mock data types
import type { SanityReview, SanityArticle, SanityNews } from '@/types/sanity';

//  Type Definitions
// Create a new union type for any content object from Sanity
export type SanityContentObject = SanityReview | SanityArticle | SanityNews;

export type StarActionType = 'bookmark' | 'like' | 'comment' | 'share';
export type StarType = 'history' | 'like' | 'comment' | 'share';

export type StarData = {
    id: number;
    position: THREE.Vector3;
    content: SanityContentObject;
    // This determines the star's base size based on the most significant action
    type: StarType;
    // This contains ALL actions taken on the content, used to draw the orbit
    actions: StarActionType[];
};

export type Placement = 'above' | 'below';
export type ScreenPosition = {
    top: number;
    left: number;
    placement: Placement;
};

//  Theme-aware Color & Size Mapping
export const THEME_CONFIG = {
    dark: {
        // Updated to match site accent (#00FFF0)
        reviewColor: '#00FFF0', 
        articleColor: '#E1E1E6', 
        newsColor: '#7D808C',
        pathColor: '#FFFFFF', 
        bgStarColor: '#FFFFFF', 
        bgColor: '#0A0B0F',
    },
    light: {
        // Updated to match light mode accent (#00d1c6)
        reviewColor: '#00d1c6', 
        articleColor: '#1F2937', 
        newsColor: '#6B7280',
        pathColor: '#1F2937', 
        bgStarColor: '#1F2937', 
        bgColor: '#F0F2F5',
    },
};

const BASE_SIZE = 0.035;
const BOOKMARK_MULTIPLIER = 1.6;

export const SIZES: Record<StarType, number> = {
    history: BASE_SIZE,
    like: BASE_SIZE * 1.3,
    comment: BASE_SIZE * 1.6,
    share: BASE_SIZE * 2.0,
};

// A bookmarked star is ALWAYS the largest version of its type
export const getStarSize = (star: StarData) => {
    // legacyId is the correct property for the numeric ID
    return star.actions.includes('bookmark') ? SIZES['share'] * BOOKMARK_MULTIPLIER : SIZES[star.type];
};