// app/celestial-almanac/index.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyClass } from '@/hooks/useBodyClass';
import * as THREE from 'three';
import { THEME_CONFIG, OrbitalBodyData, ScreenPosition } from './config';
import { StarPreviewCard } from './StarPreviewCard';
import { Scene } from './Scene';
import ConstellationControlPanel, { ConstellationSettings, Preset } from '@/components/constellation/ConstellationControlPanel';
import type { SanityGameRelease } from '@/types/sanity';
import styles from '@/components/constellation/ConstellationControlPanel.module.css';
import { PerformanceMonitor } from '@react-three/drei'; // <-- IMPORT ADDED

const isFeatureLive = false;

const CelestialGearIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"></circle>
    <path d="M12 2v2m0 16v2m8.5-10h-2m-13 0h-2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"></path>
  </svg>
);

const ComingSoonOverlay = () => {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--bg-primary) 80%, transparent) 0%, color-mix(in srgb, var(--bg-primary) 98%, transparent) 70%)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        >
            <motion.h1
                style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: 'clamp(4rem, 10vw, 8rem)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    textShadow: '0 0 30px var(--border-color)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
            >
                قريبا
            </motion.h1>
        </motion.div>
    );
};


export default function CelestialAlmanac({ releases }: { releases: SanityGameRelease[] }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // SMART PERFORMANCE: Start at 1.5, let the monitor adjust up to 2 or down to 0.5
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => { 
      setIsHydrated(true); 
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useBodyClass('constellation-active');
  useBodyClass('fullscreen-active', isFullscreen);

  const { resolvedTheme } = useTheme();
  const [activeBody, setActiveBody] = useState<OrbitalBodyData | null>(null);
  const [activeBodyPosition, setActiveBodyPosition] = useState<ScreenPosition | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const PRESETS: Record<Preset, ConstellationSettings> = useMemo(() => ({
    'أداء': { activePreset: 'أداء', starCountMultiplier: 0.2, bloomIntensity: 0, alwaysShowOrbits: false, flawlessPathThickness: 1 },
    'مُتَّزِن': { activePreset: 'مُتَّزِن', starCountMultiplier: 1.0, bloomIntensity: 1.1, alwaysShowOrbits: false, flawlessPathThickness: 1.5 },
    'فائق': { activePreset: 'فائق', starCountMultiplier: 1.5, bloomIntensity: 1.8, alwaysShowOrbits: false, flawlessPathThickness: 2.0 },
  }), []);

  const [settings, setSettings] = useState<ConstellationSettings>(PRESETS['مُتَّزِن']);
  const userIntentBloom = useRef(PRESETS['مُتَّزِن'].bloomIntensity);

  useEffect(() => {
    if (resolvedTheme === 'light') {
        if (settings.bloomIntensity > 0) {
            setSettings(s => ({ ...s, bloomIntensity: 0 }));
        }
    } else {
        if (settings.bloomIntensity !== userIntentBloom.current) {
            setSettings(s => ({ ...s, bloomIntensity: userIntentBloom.current }));
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  useEffect(() => {
    if (resolvedTheme === 'dark' && settings.activePreset === 'custom') {
        userIntentBloom.current = settings.bloomIntensity;
    }
  }, [settings.bloomIntensity, settings.activePreset, resolvedTheme]);

  const handlePresetChange = (preset: Preset) => {
    let newSettings = { ...PRESETS[preset] };
    userIntentBloom.current = newSettings.bloomIntensity;
    if (resolvedTheme === 'light') {
        newSettings.bloomIntensity = 0;
    }
    setSettings(newSettings);
  };

  const isDark = resolvedTheme === 'dark';
  const themeColors = isDark ? THEME_CONFIG.dark : THEME_CONFIG.light;
  
  const orbitalData = useMemo(() => {
    if (!isHydrated) return [];
    const releasesToUse = releases.length > 0 ? releases : Array.from({ length: 30 }).map((_, i) => ({
        _id: `placeholder-${i}`,
        legacyId: 9000 + i, 
        title: `Upcoming Game ${i + 1}`,
        releaseDate: new Date(2025, Math.floor(i / 3), (i % 28) + 1).toISOString(),
        slug: `upcoming-game-${i+1}`,
        synopsis: 'Details to be revealed soon.',
        platforms: [] as any,
        mainImage: {} as any
    }));
    
    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const releasesByMonth = releasesToUse.reduce((acc, release) => {
        const date = new Date(release.releaseDate);
        const year = date.getUTCFullYear();
        const monthIndex = date.getUTCMonth();
        const monthKey = `${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]} ${year}`;
        
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(release as SanityGameRelease);
        return acc;
    }, {} as Record<string, SanityGameRelease[]>);
    
    const sortedMonths = Object.keys(releasesByMonth).sort((a, b) => {
        const dateA = new Date(a.split(' - ')[1]);
        const dateB = new Date(b.split(' - ')[1]);
        return dateA.getTime() - dateB.getTime();
    });

    const startRadius = 2; const radiusIncrement = 0.8;
    return sortedMonths.map((month, index) => {
      const monthReleases = releasesByMonth[month]; const radius = startRadius + index * radiusIncrement;
      const bodies = monthReleases.map((release, bodyIndex) => {
        const angle = (bodyIndex / monthReleases.length) * Math.PI * 2;
        const position = new THREE.Vector3( radius * Math.cos(angle), radius * Math.sin(angle), (Math.random() - 0.5) * 0.1 );
        return { id: release._id, position, content: release };
      });
      return { month, radius, bodies };
    });
  }, [isHydrated, releases]);

  const handleSetActiveBody = useCallback((body: OrbitalBodyData, position: ScreenPosition) => { setActiveBody(body); setActiveBodyPosition(position); }, []);
  const handleClosePreview = useCallback(() => { setActiveBody(null); setActiveBodyPosition(null); }, []);

  if (!isHydrated) { return <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', width: '100%' }} />; }

  return (
    <>
      {isFeatureLive && (
          <AnimatePresence>
            {activeBody && activeBodyPosition && (
              <motion.div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={handleClosePreview} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StarPreviewCard orbitalBody={activeBody} position={activeBodyPosition} onClose={handleClosePreview} />
              </motion.div>
            )}
            {isPanelOpen && <ConstellationControlPanel settings={settings} setSettings={setSettings} onClose={() => setIsPanelOpen(false)} onPresetChange={handlePresetChange} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />}
          </AnimatePresence>
      )}

      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - var(--nav-height-scrolled))' }}>
        {isFeatureLive && (
            <motion.button className={styles.settingsButton} onClick={() => setIsPanelOpen(true)} title="فتح إعدادات الفلك" whileHover={{ scale: 1.1, rotate: 90 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} whileTap={{ scale: 0.9 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
                <CelestialGearIcon />
            </motion.button>
        )}
        <Canvas 
            camera={{ position: [0, 0, 8], fov: 60 }}
            dpr={dpr}
        >
          {/* SMART MONITOR: Adjusts resolution based on actual FPS */}
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(2)} />
          <Scene settings={settings} orbitalData={orbitalData} themeColors={themeColors} setActiveStar={handleSetActiveBody} isFeatureLive={isFeatureLive} />
        </Canvas>

        <ComingSoonOverlay />
      </div>
    </>
  );
}