// components/FPSAutoTuner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceStore, PerformanceTier } from '@/lib/performanceStore';
import { useIsMobile } from '@/hooks/useIsMobile';

// --- CONFIGURATION ---
const CHECK_INTERVAL = 250; 
const STARTUP_GRACE_PERIOD = 4000; 
const COOLDOWN_AFTER_CHANGE = 2000; 

// --- THRESHOLDS ---
const DESKTOP_FPS_CRITICAL = 22; // Slide show -> Rocket Drop
const DESKTOP_FPS_BAD = 30;      // Stutter -> Step Drop
const DESKTOP_FPS_GOOD = 42;     // Smooth -> Step Up
const DESKTOP_FPS_PERFECT = 58;  // Butter -> Rocket Up

const MOBILE_FPS_CRITICAL = 22;
const MOBILE_FPS_BAD = 32; 
const MOBILE_FPS_GOOD = 45;
const MOBILE_FPS_PERFECT = 58;

// How many times can a tier fail before we ban it?
// 2 Failures = "Soft Experimentation" -> "Lock"
const MAX_FAILURES_PER_TIER = 2; 

export default function FPSAutoTuner() {
    const isMobile = useIsMobile();
    const { 
        isAutoTuningEnabled, 
        setPerformanceTier,
        isGlassmorphismEnabled,
        isBackgroundVisible,
        isLivingCardEnabled,
        isFlyingTagsEnabled,
        isCornerAnimationEnabled,
        isCarouselAutoScrollEnabled
    } = usePerformanceStore();
    
    const rafId = useRef<number>(0);
    const lastCheckTime = useRef<number>(0);
    const frameCount = useRef<number>(0);
    const goodFpsStreak = useRef<number>(0); 
    const lastTierChangeTime = useRef<number>(0);
    const startTimeRef = useRef<number>(0); 
    const currentTierRef = useRef<PerformanceTier>(6);
    const hasInitializedMobileDefaults = useRef(false);
    
    // Tracks failures per tier (Index 0-6).
    // failuresRef.current[5] = number of times Tier 5 caused lag.
    const failuresRef = useRef<number[]>([0,0,0,0,0,0,0]);

    // 0. MOBILE FIRST RUN CHECK
    // If this is a fresh visit (no stored settings) and it's mobile, force a lighter tier immediately.
    useEffect(() => {
        if (isMobile && !hasInitializedMobileDefaults.current) {
            const hasStoredSettings = typeof window !== 'undefined' && !!localStorage.getItem('eternalgames-performance-settings');
            
            if (!hasStoredSettings) {
                console.log("[AutoTuner] Fresh mobile visit detected. Defaulting to Tier 3 (No Flying Tags/Glass).");
                // Tier 3 disables Flying Tags and Glassmorphism but keeps basic animations
                setPerformanceTier(3);
            }
            hasInitializedMobileDefaults.current = true;
        }
    }, [isMobile, setPerformanceTier]);

    // 1. Sync Ref to Store State
    useEffect(() => {
        let tier: PerformanceTier = 0;
        if (isGlassmorphismEnabled) tier = 6;      
        else if (isLivingCardEnabled) tier = 5;    
        else if (isFlyingTagsEnabled) tier = 4;    
        else if (isCornerAnimationEnabled) tier = 3; 
        else if (isCarouselAutoScrollEnabled) tier = 2; 
        else if (isBackgroundVisible) tier = 1;    
        else tier = 0;                             
        
        currentTierRef.current = tier;
    }, [
        isGlassmorphismEnabled, 
        isBackgroundVisible, 
        isLivingCardEnabled, 
        isFlyingTagsEnabled, 
        isCornerAnimationEnabled,
        isCarouselAutoScrollEnabled
    ]);

    // 2. The Tuner Loop
    useEffect(() => {
        if (!isAutoTuningEnabled) {
            cancelAnimationFrame(rafId.current);
            return;
        }

        // RESET: If user toggles Auto on manually, clear failures to allow re-testing.
        failuresRef.current = [0,0,0,0,0,0,0];

        const now = performance.now();
        lastCheckTime.current = now;
        lastTierChangeTime.current = now;
        startTimeRef.current = now;
        frameCount.current = 0;
        goodFpsStreak.current = 0;
        
        const loop = () => {
            rafId.current = requestAnimationFrame(loop);
            frameCount.current++;

            const loopNow = performance.now();
            const elapsed = loopNow - lastCheckTime.current;

            if (elapsed >= CHECK_INTERVAL) {
                const fps = Math.round((frameCount.current * 1000) / elapsed);
                
                lastCheckTime.current = loopNow;
                frameCount.current = 0;

                if (loopNow - startTimeRef.current < STARTUP_GRACE_PERIOD) return; 
                if (loopNow - lastTierChangeTime.current < COOLDOWN_AFTER_CHANGE) return; 

                const current = currentTierRef.current;
                const CRITICAL = isMobile ? MOBILE_FPS_CRITICAL : DESKTOP_FPS_CRITICAL;
                const BAD = isMobile ? MOBILE_FPS_BAD : DESKTOP_FPS_BAD;
                const GOOD = isMobile ? MOBILE_FPS_GOOD : DESKTOP_FPS_GOOD;
                const PERFECT = isMobile ? MOBILE_FPS_PERFECT : DESKTOP_FPS_PERFECT;

                // --- DOWNGRADE LOGIC ---
                if (fps < BAD) {
                    if (current > 0) {
                        let target: PerformanceTier = (current - 1) as PerformanceTier;
                        
                        // Mark current tier as failed (Strike 1)
                        failuresRef.current[current] = (failuresRef.current[current] || 0) + 1;

                        if (fps < CRITICAL) {
                            // CRITICAL: Rocket Drop (Skip tiers)
                            const jump = current > 2 ? 2 : 1; 
                            target = Math.max(0, current - jump) as PerformanceTier;
                            
                            // Penalize intermediate tiers max immediately because performance was critical
                            for (let t = current; t > target; t--) {
                                failuresRef.current[t] = MAX_FAILURES_PER_TIER; 
                            }
                            console.warn(`[AutoTuner] 🚨 CRITICAL (${fps}fps). Rocket Drop ${current} -> ${target}`);
                        } else {
                            // BAD: Step Drop (Soft experiment)
                            console.warn(`[AutoTuner] 📉 Lag (${fps}fps). Soft Drop ${current} -> ${target}`);
                        }

                        setPerformanceTier(target);
                        lastTierChangeTime.current = loopNow;
                        goodFpsStreak.current = 0;
                    }
                    return; // Don't check for upgrade in the same tick
                }

                // --- UPGRADE LOGIC ---
                if (fps >= GOOD) {
                    goodFpsStreak.current++;

                    let target: PerformanceTier = current;
                    
                    // ROCKET JUMP: Perfect FPS
                    if (fps >= PERFECT && goodFpsStreak.current >= 6) { // 1.5s stable
                        let rocketTarget = current;
                        if (current <= 2) rocketTarget = 4;
                        else if (current === 3) rocketTarget = 5;
                        else if (current >= 4) rocketTarget = 6;
                        
                        // Only jump if target hasn't failed too many times
                        if (failuresRef.current[rocketTarget as number] < MAX_FAILURES_PER_TIER) {
                            target = rocketTarget as PerformanceTier;
                        }
                    }
                    
                    // STEP JUMP: Good FPS (Fallback if Rocket blocked)
                    if (target === current && current < 6 && goodFpsStreak.current >= 10) { // 2.5s stable
                         const stepTarget = (current + 1) as PerformanceTier;
                         // Only step up if target hasn't failed too many times
                         if (failuresRef.current[stepTarget] < MAX_FAILURES_PER_TIER) {
                             target = stepTarget;
                         }
                    }

                    // Apply Upgrade
                    if (target > current) {
                         console.log(`[AutoTuner] 📈 Stable (${fps}fps). Upgrading ${current} -> ${target}`);
                         setPerformanceTier(target);
                         lastTierChangeTime.current = loopNow;
                         goodFpsStreak.current = 0;
                    }
                } else {
                    // FPS is Okay (Not Good, Not Bad). Hold.
                    goodFpsStreak.current = 0;
                }
            }
        };

        rafId.current = requestAnimationFrame(loop);
        
        return () => cancelAnimationFrame(rafId.current);
    }, [isAutoTuningEnabled, isMobile, setPerformanceTier]);

    return null;
}