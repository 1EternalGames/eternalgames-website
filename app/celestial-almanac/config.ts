// app/celestial-almanac/config.ts

import * as THREE from 'three';
import type { SanityGameRelease } from '@/types/sanity';

//  Type Definitions adapted for the Almanac
export type ContentObject = SanityGameRelease;

export type OrbitalBodyData = {
  id: string; // Sanity document _id
  position: THREE.Vector3;
  content: ContentObject;
};

export type OrbitalSystemData = {
  month: string;
  radius: number;
  bodies: OrbitalBodyData[];
};

export type Placement = 'above' | 'below';

export type ScreenPosition = {
  top: number;
  left: number;
  placement: Placement;
};

//  Theme-aware Color & Size Mapping (Retained from Constellation)
export const THEME_CONFIG = {
  dark: {
    sunColor: '#00E5FF', // As requested
    orbitColor: 'rgba(255, 255, 255, 0.2)',
    starColor: '#FFFFFF',
    hoverStarColor: '#00E5FF',
    pathColor: '#FFFFFF',
    bgStarColor: '#FFFFFF',
    bgColor: '#0A0B0F',
  },
  light: {
    sunColor: '#0891B2',
    orbitColor: 'rgba(0, 0, 0, 0.15)',
    starColor: '#1F2937',
    hoverStarColor: '#0891B2',
    pathColor: '#1F2937',
    bgStarColor: '#1F2937',
    bgColor: '#F0F2F5',
  },
};
























