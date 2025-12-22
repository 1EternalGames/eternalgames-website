// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';

// --- CONFIGURATION ---
const CHECK_INTERVAL = 300; // Check every 300ms (Very snappy)
const WARMUP_PERIOD = 500;  // Only wait 0.5s before acting
const COOLDOWN_AFTER_CHANGE = 2000; // Wait 2s after changing tier to let DOM settle

// --- THRESHOLDS ---
const FPS_CRITICAL = 20; // Slide show -> Drop 2-3 tiers
const FPS_BAD = 40;      // Laggy -> Drop 1 tier
const FPS_GOOD = 55;     // Smooth -> Upgrade

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
    const startTime = useRef<number>(0);
    const lastChangeTime = useRef<number>(0); // Cooldown tracker
    
    // Internal tracking to prevent Redux/Zustand thrashing
    const currentTier = useRef<PerformanceTier>(5); 
    const goodStreak = useRef<number>(0);

    // 1. SYNC REF WITH REALITY
    // Keeps our local ref updated with the actual state without triggering re-renders
    useEffect(() => {
        let tier: PerformanceTier = 0;
        if (isGlassmorphismEnabled) tier = 5;
        else if (isBackgroundVisible) tier = 4;
        else if (isLivingCardEnabled) tier = 3;
        else if (isFlyingTagsEnabled) tier = 2;
        else if (isCornerAnimationEnabled) tier = 1;
        
        currentTier.current = tier;
    }, [isGlassmorphismEnabled, isBackgroundVisible, isLivingCardEnabled, isFlyingTagsEnabled, isCornerAnimationEnabled]);

    // 2. THE ENGINE
    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        // Reset timers on mount/enable
        startTime.current = performance.now();
        lastCheckTime.current = performance.now();
        framesSinceCheck.current = 0;
        goodStreak.current = 0;
        lastChangeTime.current = 0;

        const loop = (timestamp: number) => {
            rafId.current = requestAnimationFrame(loop);
            
            framesSinceCheck.current++;
            const now = performance.now();
            const elapsed = now - lastCheckTime.current;

            // SAFETY: If elapsed is absurdly high (> 500ms for a single check cycle), 
            // the user likely tabbed out or the thread froze completely. 
            // Reset the clock to prevent a false "0 FPS" calculation.
            if (elapsed > 2000) {
                lastCheckTime.current = now;
                framesSinceCheck.current = 0;
                return;
            }

            // Perform Check
            if (elapsed > CHECK_INTERVAL) {
                const fps = Math.round((framesSinceCheck.current * 1000) / elapsed);
                
                // Reset counters
                lastCheckTime.current = now;
                framesSinceCheck.current = 0;

                const timeSinceStart = now - startTime.current;
                const timeSinceChange = now - lastChangeTime.current;

                // Only act if we are past warmup AND past the modification cooldown
                if (timeSinceStart > WARMUP_PERIOD && timeSinceChange > COOLDOWN_AFTER_CHANGE) {
                    
                    // --- LOGIC: DOWNGRADES (Fast Reaction) ---
                    
                    // CRITICAL LAG (< 20 FPS): Emergency Eject
                    if (fps < FPS_CRITICAL) {
                        if (currentTier.current > 1) {
                            // If we are at Ultra (5), drop straight to Low (2)
                            // If at Medium (3), drop to Potato (1)
                            const targetTier = Math.max(1, currentTier.current - 3) as PerformanceTier;
                            
                            console.warn(`[AutoTuner] 🚨 CRITICAL LAG (${fps} FPS). Dumping tiers: ${currentTier.current} -> ${targetTier}`);
                            
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }
                    // BAD LAG (< 40 FPS): Step Down
                    else if (fps < FPS_BAD) {
                        if (currentTier.current > 0) {
                            const targetTier = (currentTier.current - 1) as PerformanceTier;
                            console.log(`[AutoTuner] Lag detected (${fps} FPS). Dropping: ${currentTier.current} -> ${targetTier}`);
                            setPerformanceTier(targetTier);
                            lastChangeTime.current = now;
                            goodStreak.current = 0;
                        }
                    }

                    // --- LOGIC: UPGRADES (Slow Reaction) ---
                    // Requires sustained smoothness to upgrade
                    else if (fps >= FPS_GOOD) {
                        goodStreak.current++;

                        // Need 5 consecutive good checks (1.5 seconds) to upgrade
                        if (goodStreak.current >= 5) {
                            if (currentTier.current < 5) {
                                const targetTier = (currentTier.current + 1) as PerformanceTier;
                                console.log(`[AutoTuner] Smooth sailing (${fps} FPS). Upgrading: ${currentTier.current} -> ${targetTier}`);
                                setPerformanceTier(targetTier);
                                lastChangeTime.current = now;
                                goodStreak.current = 0;
                            }
                        }
                    } else {
                        // In the grey area (40-55 FPS)
                        // Reset good streak, but don't drop. Maintain status quo.
                        goodStreak.current = 0;
                    }
                }
            }
        };

        rafId.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, setPerformanceTier]);

    // 3. HARDWARE CHECK (Run once on mount)
    useEffect(() => {
        if (typeof window !== 'undefined' && isAutoTuningEnabled) {
            const cores = navigator.hardwareConcurrency || 4;
            // If potato device detected immediately, don't wait for the loop to figure it out.
            if (cores < 4) {
                console.log(`[AutoTuner] Weak CPU (${cores} cores). Starting at Tier 2.`);
                setPerformanceTier(2);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}