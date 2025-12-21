// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';

// --- CONFIGURATION ---
const CHECK_INTERVAL = 500; // Faster polling (0.5s instead of 1s)
const WARMUP_PERIOD = 1500; // Shorter warmup

// --- THRESHOLDS ---
const FPS_PANIC_THRESHOLD = 30; // Instant drop if below this
const FPS_DROP_THRESHOLD = 45;  // Gradual drop if below this
const FPS_PERFECT_THRESHOLD = 55; // Upgrade if above this

export default function FPSAutoTuner() {
    const { 
        isAutoTuningEnabled, 
        setPerformanceTier,
        isGlassmorphismEnabled,
        isBackgroundVisible,
        isLivingCardEnabled,
        isFlyingTagsEnabled,
        isCornerAnimationEnabled
    } = usePerformanceStore();
    
    const rafId = useRef<number>(0);
    const framesSinceCheck = useRef<number>(0);
    const lastCheckTime = useRef<number>(0);
    
    const currentTier = useRef<PerformanceTier>(5); 
    const badStreak = useRef<number>(0);
    const goodStreak = useRef<number>(0);
    const hasInitialized = useRef(false);

    // 1. SMART INITIALIZATION
    useEffect(() => {
        if (hasInitialized.current) return;
        
        // Calculate initial tier based on active flags
        let tier: PerformanceTier = 0;
        if (isGlassmorphismEnabled) tier = 5;
        else if (isBackgroundVisible) tier = 4;
        else if (isLivingCardEnabled) tier = 3;
        else if (isFlyingTagsEnabled) tier = 2;
        else if (isCornerAnimationEnabled) tier = 1;
        
        // Hardware Heuristic (Client-side only)
        if (typeof window !== 'undefined' && isAutoTuningEnabled) {
            const cores = navigator.hardwareConcurrency || 4;
            // If device is weak (< 4 cores), cap start tier at 2 (Low)
            // This prevents initial lag spike on potato phones
            if (cores < 4 && tier > 2) {
                console.log(`[AutoTuner] Weak Hardware detected (${cores} cores). Starting at Tier 2.`);
                tier = 2;
                setPerformanceTier(2);
            }
        }

        currentTier.current = tier;
        hasInitialized.current = true;
    }, [isAutoTuningEnabled, isGlassmorphismEnabled, isBackgroundVisible, isLivingCardEnabled, isFlyingTagsEnabled, isCornerAnimationEnabled, setPerformanceTier]);

    // 2. THE LOOP
    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        lastCheckTime.current = performance.now();

        const loop = (timestamp: number) => {
            framesSinceCheck.current++;
            const elapsed = timestamp - lastCheckTime.current;

            if (elapsed > CHECK_INTERVAL) {
                const fps = Math.round((framesSinceCheck.current * 1000) / elapsed);
                
                framesSinceCheck.current = 0;
                lastCheckTime.current = timestamp;

                if (timestamp > WARMUP_PERIOD) {
                    
                    // --- PANIC MODE (Instantly drop 2 tiers) ---
                    if (fps < FPS_PANIC_THRESHOLD) {
                        if (currentTier.current > 0) {
                            const newTier = Math.max(0, currentTier.current - 2) as PerformanceTier;
                            console.warn(`[AutoTuner] 🚨 PANIC! FPS ${fps}. Dropping to Tier ${newTier}`);
                            currentTier.current = newTier;
                            setPerformanceTier(newTier);
                            badStreak.current = 0;
                            goodStreak.current = 0;
                        }
                    }
                    // --- GRADUAL DOWNGRADE ---
                    else if (fps < FPS_DROP_THRESHOLD) {
                        badStreak.current++;
                        goodStreak.current = 0;

                        // Drop after 2 bad checks (1 second)
                        if (badStreak.current >= 2) {
                            if (currentTier.current > 0) {
                                const newTier = (currentTier.current - 1) as PerformanceTier;
                                console.warn(`[AutoTuner] FPS Low (${fps}). Dropping to Tier ${newTier}`);
                                currentTier.current = newTier;
                                setPerformanceTier(newTier);
                                badStreak.current = 0; 
                            }
                        }
                    } 
                    // --- SMART UPGRADE ---
                    else if (fps >= FPS_PERFECT_THRESHOLD) {
                        goodStreak.current++;
                        badStreak.current = 0;

                        // Dynamic Confidence:
                        // If current tier is low (0-2), upgrade fast (2 checks = 1 sec).
                        // If current tier is high (3+), be cautious (4 checks = 2 sec).
                        const requiredStreak = currentTier.current < 3 ? 2 : 4;

                        if (goodStreak.current >= requiredStreak) {
                            if (currentTier.current < 5) {
                                const newTier = (currentTier.current + 1) as PerformanceTier;
                                console.log(`[AutoTuner] FPS Stable (${fps}). Upgrading to Tier ${newTier}`);
                                currentTier.current = newTier;
                                setPerformanceTier(newTier);
                                goodStreak.current = 0;
                            }
                        }
                    } 
                    else {
                        // In the "Okay" zone (45-55 FPS) - maintain status quo
                        badStreak.current = 0;
                        goodStreak.current = 0;
                    }
                }
            }

            rafId.current = requestAnimationFrame(loop);
        };

        rafId.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, setPerformanceTier]);

    return null;
}