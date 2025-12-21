// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';

// CONSTANTS
const CHECK_INTERVAL = 1000; 
const WARMUP_PERIOD = 2000; 

// THRESHOLDS
const FPS_DROP_THRESHOLD = 45; 
const FPS_PERFECT_THRESHOLD = 58; 
const CONSECUTIVE_BAD_CHECKS = 2; 
const CONSECUTIVE_GOOD_CHECKS = 5; 

export default function FPSAutoTuner() {
    const { 
        isAutoTuningEnabled, 
        setPerformanceTier,
        // Import flags to calculate initial state
        isGlassmorphismEnabled,
        isBackgroundVisible,
        isLivingCardEnabled,
        isFlyingTagsEnabled,
        isCornerAnimationEnabled
    } = usePerformanceStore();
    
    const rafId = useRef<number>(0);
    const lastTime = useRef<number>(0);
    const framesSinceCheck = useRef<number>(0);
    const lastCheckTime = useRef<number>(0);
    
    // Default to Max Tier
    const currentTier = useRef<PerformanceTier>(5); 
    const badStreak = useRef<number>(0);
    const goodStreak = useRef<number>(0);

    // Sync Effect: Runs when Auto-Tuning is toggled ON or flags change
    useEffect(() => {
        if (isAutoTuningEnabled) {
            // Determine current tier based on active flags (Top-down check)
            let tier: PerformanceTier = 0;
            
            if (isGlassmorphismEnabled) tier = 5;
            else if (isBackgroundVisible) tier = 4;
            else if (isLivingCardEnabled) tier = 3;
            else if (isFlyingTagsEnabled) tier = 2;
            else if (isCornerAnimationEnabled) tier = 1;
            else tier = 0;
            
            currentTier.current = tier;
            badStreak.current = 0;
            goodStreak.current = 0;
            
            console.log(`[AutoTuner] Sync: Initialized at Tier ${tier}`);
        }
    }, [isAutoTuningEnabled, isGlassmorphismEnabled, isBackgroundVisible, isLivingCardEnabled, isFlyingTagsEnabled, isCornerAnimationEnabled]);

    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        lastTime.current = performance.now();
        lastCheckTime.current = performance.now();

        const loop = (timestamp: number) => {
            framesSinceCheck.current++;
            const elapsed = timestamp - lastCheckTime.current;

            if (elapsed > CHECK_INTERVAL) {
                const fps = Math.round((framesSinceCheck.current * 1000) / elapsed);
                
                framesSinceCheck.current = 0;
                lastCheckTime.current = timestamp;

                if (timestamp > WARMUP_PERIOD) {
                    // --- DOWNGRADE LOGIC ---
                    if (fps < FPS_DROP_THRESHOLD) {
                        badStreak.current++;
                        goodStreak.current = 0;

                        if (badStreak.current >= CONSECUTIVE_BAD_CHECKS) {
                            if (currentTier.current > 0) {
                                const newTier = (currentTier.current - 1) as PerformanceTier;
                                console.warn(`[AutoTuner] FPS Low (${fps}). Dropping to Tier ${newTier}`);
                                currentTier.current = newTier;
                                setPerformanceTier(newTier);
                                badStreak.current = 0; 
                            }
                        }
                    } 
                    // --- UPGRADE LOGIC ---
                    else if (fps >= FPS_PERFECT_THRESHOLD) {
                        goodStreak.current++;
                        badStreak.current = 0;

                        if (goodStreak.current >= CONSECUTIVE_GOOD_CHECKS) {
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