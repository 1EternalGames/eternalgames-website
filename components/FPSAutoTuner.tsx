// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';
import { useIsMobile } from '@/hooks/useIsMobile';

// --- CONFIGURATION ---
const CHECK_INTERVAL = 500; // Increased to average out spikes
const WARMUP_PERIOD = 3000; // Significantly increased to let mobile browsers settle
const COOLDOWN_AFTER_CHANGE = 5000; // Longer cooldown to prevent oscillation

// --- DESKTOP THRESHOLDS ---
const DESKTOP_FPS_CRITICAL = 25;
const DESKTOP_FPS_BAD = 48;
const DESKTOP_FPS_GOOD = 58;

// --- MOBILE THRESHOLDS ---
// Mobile browsers often throttle or have varying refresh rates (e.g. 120hz vs 60hz vs 30hz power save)
// We allow a lower baseline before killing effects.
const MOBILE_FPS_CRITICAL = 20;
const MOBILE_FPS_BAD = 35; 
const MOBILE_FPS_GOOD = 55;

// --- STREAK CONFIG ---
const REQUIRED_GOOD_STREAK = 15;

export default function FPSAutoTuner() {
    const isMobile = useIsMobile();
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
    const lastActivityTime = useRef<number>(0);
    
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
            
            // Relaxed initial hardware check
            if (cores < 4 || memory < 2) {
                console.log(`[AutoTuner] Weak Hardware Detected (${cores} cores, ${memory}GB RAM). Initializing at Low Tier.`);
                setPerformanceTier(2);
            } else if (cores < 6 && memory < 4) {
                console.log(`[AutoTuner] Mid-Range Hardware Detected. Initializing at Medium Tier.`);
                setPerformanceTier(3);
            } else {
                // Default to Ultra for capable devices
                setPerformanceTier(5);
            }
        }
    }, []);

    // 4. THE ENGINE
    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        startTime.current = performance.now();
        lastCheckTime.current = performance.now();
        lastActivityTime.current = performance.now();
        framesSinceCheck.current = 0;
        goodStreak.current = 0;
        lastChangeTime.current = 0;

        const loop = (timestamp: number) => {
            rafId.current = requestAnimationFrame(loop);
            
            framesSinceCheck.current++;
            const now = performance.now();
            const elapsed = now - lastCheckTime.current;

            if (elapsed > 2000) {
                // If elapsed is huge (tab inactive), reset
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

                // Thresholds based on device type
                const fpsCritical = isMobile ? MOBILE_FPS_CRITICAL : DESKTOP_FPS_CRITICAL;
                const fpsBad = isMobile ? MOBILE_FPS_BAD : DESKTOP_FPS_BAD;
                const fpsGood = isMobile ? MOBILE_FPS_GOOD : DESKTOP_FPS_GOOD;

                // Is the user actively doing something? (interacting within last 1 second)
                const isUserActive = timeSinceActivity < 1000;

                if (timeSinceStart > WARMUP_PERIOD && timeSinceChange > COOLDOWN_AFTER_CHANGE) {
                    
                    // --- DOWNGRADE LOGIC ---
                    if (fps < fpsCritical) {
                        // Critical drop: Dump 2 tiers immediately
                        if (currentTier.current > 1) {
                            const targetTier = Math.max(1, currentTier.current - 2) as PerformanceTier;
                            console.warn(`[AutoTuner] 🚨 CRITICAL DROP (${fps} FPS). Dumping to Tier ${targetTier}`);
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }
                    else if (fps < fpsBad) {
                        // Bad performance: Drop 1 tier
                        if (currentTier.current > 0) {
                            const targetTier = (currentTier.current - 1) as PerformanceTier;
                            console.log(`[AutoTuner] Lag detected (${fps} FPS). Dropping to Tier ${targetTier}`);
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }
                    
                    // --- UPGRADE LOGIC (Interaction Dependent) ---
                    else if (fps >= fpsGood) {
                        if (isUserActive) {
                            goodStreak.current++;

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
                            if (goodStreak.current > 0) {
                                goodStreak.current = Math.max(0, goodStreak.current - 1); // Decay slowly instead of hard reset
                            }
                        }
                    } else {
                        goodStreak.current = 0;
                    }
                }
            }
        };

        rafId.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, setPerformanceTier, isMobile]);

    return null;
}