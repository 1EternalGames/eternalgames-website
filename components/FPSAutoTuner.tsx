// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useToast } from '@/lib/toastStore';

// CONFIGURATION
const CHECK_INTERVAL = 1000; // Check every second
const STABILIZATION_TIME = 5000; // Wait 5s before first check
const COOLDOWN_TIME = 10000; // Wait 10s after changing tier before checking again

// THRESHOLDS
const DESKTOP_LOW_FPS = 40; // Drop to Tier 5 (No Flying Tags)
const DESKTOP_CRITICAL_FPS = 15; // Drop to Tier 0 (All Off)

const MOBILE_LOW_FPS = 35;
const MOBILE_CRITICAL_FPS = 15;

export default function FPSAutoTuner() {
    const isMobile = useIsMobile();
    const toast = useToast();
    
    const { 
        isAutoTuningEnabled, 
        setPerformanceTier,
        isGlassmorphismEnabled,
        isFlyingTagsEnabled,
        isBackgroundVisible
    } = usePerformanceStore();

    // Determine current logical tier
    const getCurrentTier = (): PerformanceTier => {
        if (!isBackgroundVisible) return 0;
        if (!isFlyingTagsEnabled) return 5;
        if (isFlyingTagsEnabled && isGlassmorphismEnabled) return 6;
        return 6; // Default to max if ambiguous
    };

    const rafId = useRef<number>(0);
    const lastCheckTime = useRef<number>(0);
    const frameCount = useRef<number>(0);
    const startTime = useRef<number>(0);
    const lastTierChange = useRef<number>(0);
    
    // Critical failure counter
    const criticalFailures = useRef<number>(0);

    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        // Reset counters on mount/enable
        frameCount.current = 0;
        startTime.current = performance.now();
        lastCheckTime.current = performance.now();
        lastTierChange.current = performance.now();
        criticalFailures.current = 0;

        const loop = () => {
            rafId.current = requestAnimationFrame(loop);
            const now = performance.now();
            frameCount.current++;

            // Wait for initialization grace period
            if (now - startTime.current < STABILIZATION_TIME) return;

            // Wait for cooldown after a change
            if (now - lastTierChange.current < COOLDOWN_TIME) return;

            const elapsed = now - lastCheckTime.current;

            if (elapsed >= CHECK_INTERVAL) {
                const fps = Math.round((frameCount.current * 1000) / elapsed);
                const currentTier = getCurrentTier();

                const LOW_THRESHOLD = isMobile ? MOBILE_LOW_FPS : DESKTOP_LOW_FPS;
                const CRITICAL_THRESHOLD = isMobile ? MOBILE_CRITICAL_FPS : DESKTOP_CRITICAL_FPS;

                // 1. CRITICAL CHECK (Unusable Site)
                if (fps < CRITICAL_THRESHOLD) {
                    criticalFailures.current++;
                    
                    // If consistent critical failure (2 seconds in a row)
                    if (criticalFailures.current >= 2 && currentTier > 0) {
                        console.warn(`[AutoTuner] 🚨 Critical FPS (${fps}). Emergency Drop to Tier 0.`);
                        setPerformanceTier(0);
                        toast.error("تم تعطيل المؤثرات لضمان استقرار الموقع.", "left");
                        lastTierChange.current = now;
                        criticalFailures.current = 0;
                    }
                } else {
                    criticalFailures.current = 0; // Reset critical counter if we survived a second
                }

                // 2. LOW PERFORMANCE CHECK (Disable Flying Tags)
                // Only if we are at max tier (6)
                if (fps < LOW_THRESHOLD && currentTier === 6) {
                    console.warn(`[AutoTuner] 📉 Low FPS (${fps}). Disabling Flying Tags.`);
                    setPerformanceTier(5);
                    lastTierChange.current = now;
                }

                // Reset for next interval
                frameCount.current = 0;
                lastCheckTime.current = now;
            }
        };

        rafId.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, isMobile, setPerformanceTier, isGlassmorphismEnabled, isFlyingTagsEnabled, isBackgroundVisible]);

    return null;
}