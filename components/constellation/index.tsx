// components/constellation/index.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/store';
import { useBodyClass } from '@/hooks/useBodyClass'; // <-- IMPORT HOOK
import * as THREE from 'three';
import { THEME_CONFIG, StarData, SanityContentObject, ScreenPosition } from './config';
import { StarPreviewCard } from './StarPreviewCard';
import { Scene } from './Scene';
import ConstellationControlPanel, { ConstellationSettings, Preset } from './ConstellationControlPanel';
import { getCommentedContentIds } from '@/app/actions/userActions';
import styles from './ConstellationControlPanel.module.css';

const CelestialGearIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 2v2m0 16v2m8.5-10h-2m-13 0h-2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"></path>
    </svg>
);

export default function Constellation() {
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => { setIsHydrated(true); }, []);

    const [isFullscreen, setIsFullscreen] = useState(false);

    useBodyClass('constellation-active'); // <-- REFACTORED
    useBodyClass('fullscreen-active', isFullscreen); // <-- REFACTORED
    
    const { resolvedTheme } = useTheme();
    const { bookmarks, likes, shares } = useUserStore();
    const [userContent, setUserContent] = useState<SanityContentObject[]>([]);
    const [activeStar, setActiveStar] = useState<StarData | null>(null);
    const [activeStarPosition, setActiveStarPosition] = useState<ScreenPosition | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [commentedContentSlugs, setCommentedContentSlugs] = useState<string[]>([]);

    useEffect(() => {
        if (!isHydrated) return;
        getCommentedContentIds().then(slugs => { setCommentedContentSlugs(slugs); });

        const safeBookmarks = (bookmarks || []).map(k => Number(k.split('-')[1]));
        const safeLikes = (likes || []).map(k => Number(k.split('-')[1]));
        const safeShares = (shares || []).map(k => Number(k.split('-')[1]));
        
        const allIds = [...new Set([...safeBookmarks, ...safeLikes, ...safeShares])];
        
        if (allIds.length === 0) { 
            setUserContent([]); 
            return; 
        }

        const fetchContent = async () => {
            const response = await fetch('/api/content-by-ids', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ids: allIds }), 
            });
            if (response.ok) { 
                const data = await response.json(); 
                setUserContent(data); 
            } else {
                console.error("Failed to fetch content for Constellation:", response.statusText);
            }
        };
        fetchContent();
    }, [isHydrated, bookmarks, likes, shares]);

    const PRESETS: Record<Preset, ConstellationSettings> = useMemo(() => ({
        'أداء': { activePreset: 'أداء', starCountMultiplier: 0.2, bloomIntensity: 0, alwaysShowOrbits: false, flawlessPathThickness: 1.5 },
        'متوازن': { activePreset: 'متوازن', starCountMultiplier: 1.0, bloomIntensity: 0.9, alwaysShowOrbits: false, flawlessPathThickness: 2 },
        'فائق': { activePreset: 'فائق', starCountMultiplier: 1.5, bloomIntensity: 1.5, alwaysShowOrbits: false, flawlessPathThickness: 2.5 },
    }), []);

    const [settings, setSettings] = useState<ConstellationSettings>(PRESETS['متوازن']);
    const lastValidBloom = useRef(settings.bloomIntensity);

    useEffect(() => {
        if (settings.bloomIntensity > 0) {
            lastValidBloom.current = settings.bloomIntensity;
        }
    }, [settings.bloomIntensity]);
    
    useEffect(() => {
        if (resolvedTheme === 'light') {
            if (settings.bloomIntensity > 0) {
                setSettings(s => ({ ...s, bloomIntensity: 0, activePreset: 'custom' }));
            }
        } else {
            if (settings.bloomIntensity === 0 && lastValidBloom.current > 0) {
                 setSettings(s => ({ ...s, bloomIntensity: lastValidBloom.current, activePreset: 'custom' }));
            }
        }
    }, [resolvedTheme, settings.bloomIntensity]);

    const handlePresetChange = (preset: Preset) => {
        let newSettings = PRESETS[preset];
        if (resolvedTheme === 'light') newSettings.bloomIntensity = 0;
        setSettings(newSettings);
    };

    const isDark = resolvedTheme === 'dark';
    const themeColors = isDark ? THEME_CONFIG.dark : THEME_CONFIG.light;

    const chronologicalStars = useMemo(() => {
        if (!isHydrated || userContent.length === 0) return [];
        
        const safeBookmarks = (bookmarks || []).map(k => Number(k.split('-')[1]));
        const safeLikes = (likes || []).map(k => Number(k.split('-')[1]));
        const safeShares = (shares || []).map(k => Number(k.split('-')[1]));

        const starMap = new Map<number, { type: "history" | "like" | "comment" | "share", actions: ("bookmark" | "like" | "comment" | "share")[], content: SanityContentObject }>();
        
        userContent.filter(content => content.legacyId != null).forEach(content => {
            const id = content.legacyId; 
            let type: "history" | "like" | "comment" | "share" = 'history'; 
            const actions: ("bookmark" | "like" | "comment" | "share")[] = [];

            if (safeLikes.includes(id)) { actions.push('like'); }
            if (safeShares.includes(id)) { actions.push('share'); }
            if (commentedContentSlugs.includes(content.slug)) { actions.push('comment'); }
            if (safeBookmarks.includes(id)) { actions.push('bookmark'); }

            if (actions.includes('like')) type = 'like';
            if (actions.includes('comment')) type = 'comment'; 
            if (actions.includes('share')) type = 'share';
            
            starMap.set(id, { type, actions: actions.sort(), content });
        });
        
        const allUserStars: StarData[] = [];
        starMap.forEach((data, id) => {
            const u=Math.random(), v=Math.random(), theta=2*Math.PI*u, phi=Math.acos(2*v-1);
            const r = 1.8 + Math.random() * 0.6;
            const position = new THREE.Vector3(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
            allUserStars.push({ id, position, content: data.content, type: data.type, actions: data.actions });
        });
        
        const sortedStars = allUserStars.sort((a, b) => 
            new Date(a.content.publishedAt).getTime() - new Date(b.content.publishedAt).getTime()
        );

        if (sortedStars.length > 1) {
            const curve = new THREE.CatmullRomCurve3( sortedStars.map(s => s.position) );
            const points = curve.getPoints(sortedStars.length - 1);
            return sortedStars.map((star, i) => ({ ...star, position: points[i] }));
        }
        return sortedStars;
    }, [isHydrated, userContent, bookmarks, likes, shares, commentedContentSlugs]);

    const handleSetActiveStar = useCallback((star: StarData, position: ScreenPosition) => { setActiveStar(star); setActiveStarPosition(position); }, []);
    const handleClosePreview = useCallback(() => { setActiveStar(null); setActiveStarPosition(null); }, []);

    if (!isHydrated) { return <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', width: '100%' }} />; }

    return (
        <>
            <AnimatePresence>
                {activeStar && activeStarPosition && ( <motion.div style={{ position: 'fixed', inset: 0, zIndex: 10000 }} onClick={handleClosePreview} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}> <StarPreviewCard starData={activeStar} position={activeStarPosition} onClose={handleClosePreview} /> </motion.div> )}
                {isPanelOpen && <ConstellationControlPanel settings={settings} setSettings={setSettings} onClose={() => setIsPanelOpen(false)} onPresetChange={handlePresetChange} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />}
            </AnimatePresence>
            <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - var(--nav-height-scrolled))' }}>
                <motion.button className={styles.settingsButton} onClick={() => setIsPanelOpen(true)} title="فتح إعدادات الكوكبة" whileHover={{ scale: 1.1, rotate: 90 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} whileTap={{ scale: 0.9 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
                    <CelestialGearIcon />
                </motion.button>
                <Canvas camera={{ position: [0, 0, 5] }}>
                    <Scene settings={settings} chronologicalStars={chronologicalStars} themeColors={themeColors} setActiveStar={handleSetActiveStar} />
                </Canvas>
                {chronologicalStars.length === 0 && ( <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', pointerEvents: 'none', padding: '2rem' }}> <motion.h1 className="page-title" style={{ fontSize: '6rem' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}> كوكبتك في انتظارك </motion.h1> <motion.p style={{ maxWidth: '600px', fontSize: '2rem', color: 'var(--text-secondary)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}> بينما تستكشف وتعجب وتشارك، ستبدأ خريطتك النجمية الشخصية في التكون هنا. </motion.p> </div> )}
            </div>
        </>
    );
}