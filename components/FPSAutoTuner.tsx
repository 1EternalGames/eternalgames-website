// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';

// --- CONFIGURATION ---
const CHECK_INTERVAL = 300; // Check every 300ms
const WARMUP_PERIOD = 800;  // Warmup time
const COOLDOWN_AFTER_CHANGE = 3000; // Wait 3s after changing tier

// --- THRESHOLDS ---
const FPS_CRITICAL = 25; // Slide show -> Drop tiers rapidly
const FPS_BAD = 45;      // Laggy -> Drop 1 tier
const FPS_GOOD = 58;     // Smooth -> Upgrade if sustained

// --- STREAK CONFIG ---
// We want ~6 seconds of smooth performance to upgrade.
// 6000ms / 300ms interval = 20 checks.
const REQUIRED_GOOD_STREAK = 20;

export default function FPSAutoTuner() {
    const { 
        isAutoTuningEnabled, 
        setPerformanceTier,
        isGlassmorphismEnabled,
        isBackgroundVisible,
        isBackgroundAnimated,
        isLivingCardEnabled,
        isFlyingTagsEnabled,
        isCornerAnimationEnabled
    } = usePerformanceStore();
    
    const rafId = useRef<number>(0);
    const framesSinceCheck = useRef<number>(0);
    const lastCheckTime = useRef<number>(0);
    const startTime = useRef<number>(0);
    const lastChangeTime = useRef<number>(0); 
    const lastActivityTime = useRef<number>(0); // Track when user last did something
    
    const currentTier = useRef<PerformanceTier>(5); 
    const goodStreak = useRef<number>(0);

    // 1. SYNC REF
    useEffect(() => {
        let tier: PerformanceTier = 0;
        if (isGlassmorphismEnabled && isBackgroundAnimated) tier = 5;
        else if (isBackgroundVisible && isBackgroundAnimated) tier = 4;
        else if (isBackgroundVisible) tier = 3;
        else if (isLivingCardEnabled) tier = 2;
        else if (isFlyingTagsEnabled) tier = 1;
        
        currentTier.current = tier;
    }, [isGlassmorphismEnabled, isBackgroundVisible, isLivingCardEnabled, isFlyingTagsEnabled, isCornerAnimationEnabled, isBackgroundAnimated]);

    // 2. ACTIVITY TRACKER
    // We listen to interactions to ensure we only "stress test" upgrades when the engine is under load.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateActivity = () => {
            lastActivityTime.current = performance.now();
        };

        // Passive listeners for performance
        window.addEventListener('mousemove', updateActivity, { passive: true });
        window.addEventListener('touchmove', updateActivity, { passive: true });
        window.addEventListener('scroll', updateActivity, { passive: true });
        window.addEventListener('keydown', updateActivity, { passive: true });
        window.addEventListener('click', updateActivity, { passive: true });

        return () => {
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('touchmove', updateActivity);
            window.removeEventListener('scroll', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
        };
    }, []);

    // 3. INITIAL HARDWARE SCAN
    useEffect(() => {
        if (typeof window !== 'undefined' && isAutoTuningEnabled) {
            const cores = navigator.hardwareConcurrency || 4;
            // @ts-ignore
            const memory = navigator.deviceMemory || 4; 
            
            if (cores < 4 || memory < 4) {
                console.log(`[AutoTuner] Weak Hardware Detected (${cores} cores, ${memory}GB RAM). Initializing at Low Tier.`);
                setPerformanceTier(2);
            } else if (cores < 6) {
                console.log(`[AutoTuner] Mid-Range Hardware Detected (${cores} cores). Initializing at Medium Tier.`);
                setPerformanceTier(3);
            } else {
                setPerformanceTier(5);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 4. THE ENGINE
    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        startTime.current = performance.now();
        lastCheckTime.current = performance.now();
        lastActivityTime.current = performance.now(); // Assume active on mount
        framesSinceCheck.current = 0;
        goodStreak.current = 0;
        lastChangeTime.current = 0;

        const loop = (timestamp: number) => {
            rafId.current = requestAnimationFrame(loop);
            
            framesSinceCheck.current++;
            const now = performance.now();
            const elapsed = now - lastCheckTime.current;

            if (elapsed > 2000) {
                lastCheckTime.current = now;
                framesSinceCheck.current = 0;
                return;
            }

            if (elapsed > CHECK_INTERVAL) {
                const fps = Math.round((framesSinceCheck.current * 1000) / elapsed);
                lastCheckTime.current = now;
                framesSinceCheck.current = 0;

                const timeSinceStart = now - startTime.current;
                const timeSinceChange = now - lastChangeTime.current;
                const timeSinceActivity = now - lastActivityTime.current;

                // Is the user actively doing something? (interacting within last 1 second)
                const isUserActive = timeSinceActivity < 1000;

                if (timeSinceStart > WARMUP_PERIOD && timeSinceChange > COOLDOWN_AFTER_CHANGE) {
                    
                    // --- DOWNGRADE LOGIC (Always active) ---
                    // Even if user is idle, if background animations cause lag, we drop.
                    if (fps < FPS_CRITICAL) {
                        if (currentTier.current > 1) {
                            const targetTier = Math.max(1, currentTier.current - 2) as PerformanceTier;
                            console.warn(`[AutoTuner] 🚨 CRITICAL DROP (${fps} FPS). Dumping to Tier ${targetTier}`);
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }
                    else if (fps < FPS_BAD) {
                        if (currentTier.current > 0) {
                            const targetTier = (currentTier.current - 1) as PerformanceTier;
                            console.log(`[AutoTuner] Lag detected (${fps} FPS). Dropping to Tier ${targetTier}`);
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }
                    
                    // --- UPGRADE LOGIC (Interaction Dependent) ---
                    // Only upgrade if performance is good WHILE the user is stressing the UI.
                    else if (fps >= FPS_GOOD) {
                        if (isUserActive) {
                            goodStreak.current++;
                            
                            // Debugging log (Optional, usually removed in prod but useful here)
                            // if (goodStreak.current % 5 === 0) console.log(`[AutoTuner] Good Streak: ${goodStreak.current}/${REQUIRED_GOOD_STREAK}`);

                            if (goodStreak.current >= REQUIRED_GOOD_STREAK) { 
                                if (currentTier.current < 5) {
                                    const targetTier = (currentTier.current + 1) as PerformanceTier;
                                    console.log(`[AutoTuner] 🚀 Performance solid under load (${fps} FPS). Upgrading to Tier ${targetTier}`);
                                    setPerformanceTier(targetTier);
                                    lastChangeTime.current = now;
                                    goodStreak.current = 0;
                                }
                            }
                        } else {
                            // User is idle. FPS is high, but we can't trust it.
                            // Reset streak? No, just pause it. 
                            // If they stop scrolling for 1 second, we don't punish them, 
                            // but we don't reward the idle time either.
                            // Actually, strict logic: If you stop interacting, we reset the test 
                            // because we need continuous proof of smoothness.
                            if (goodStreak.current > 0) {
                                goodStreak.current = Math.max(0, goodStreak.current - 1); // Decay slowly instead of hard reset
                            }
                        }
                    } else {
                        // FPS is in the "okay" range (45-57), or low but user idle
                        goodStreak.current = 0;
                    }
                }
            }
        };

        rafId.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, setPerformanceTier]);

    return null;
}