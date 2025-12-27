// components/UniversalBaseLoader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useContentStore } from '@/lib/contentStore';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// OPTIMIZATION: Dynamically import UniversalBase.
const UniversalBase = dynamic(() => import('@/components/UniversalBase'), {
    ssr: false, 
    loading: () => null
});

// Inline Splash Screen Component
const SplashScreen = () => {
    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: '#050505',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ width: '80px', height: '80px', marginBottom: '20px' }}
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 892 1617" width="100%" height="100%" style={{ filter: 'drop-shadow(0 0 10px #0dffff)' }}>
                    <path fill="#0dffff" d="M579 0 502 248 446 315 460 388 366 690 483 815 550 734 456 738 541 715 572 678 601 595 586 688 607 658 653 521 629 451 617 540 598 374 642 441 630 111zM237 196 300 413 195 633 186 551 150 619 146 690 133 659 0 911 274 732 260 665 293 719 323 697 314 593 338 660 423 413zM317 739 150 841 185 886 125 856 71 889 200 1052 169 1052 253 1156 254 1079 490 1276 523 1390 529 1295 484 1107 357 1034 328 978 277 978 312 964 369 846 317 868 281 912 290 870 261 870 221 898 278 833zM353 727 335 782 428 860 457 910 457 838zM576 762 490 842 479 919zM610 793 475 965 514 1035 524 1004 606 924zM744 564 744 734 629 826 629 934 682 962 679 972 714 1026 658 987 636 955 598 961 536 1026 602 987 628 985 646 1007 491 1617 728 1150 732 1205 841 1030 775 1062 892 841z" />
                </svg>
            </motion.div>
            
            {/* Simple pulsating line */}
            <motion.div 
                style={{ width: '150px', height: '2px', backgroundColor: '#1A1A1A', borderRadius: '2px', overflow: 'hidden' }}
            >
                <motion.div 
                    style={{ width: '100%', height: '100%', backgroundColor: '#0dffff', transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.div>
        </motion.div>
    );
};

export default function UniversalBaseLoader() {
    const { universalData, hydrateUniversal } = useContentStore();
    const pathname = usePathname();
    const isHomepage = pathname === '/';
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (!universalData && !isHomepage) {
            const fetchBackgroundData = async () => {
                try {
                    const res = await fetch('/api/universal', { 
                        cache: 'force-cache',
                        next: { revalidate: 3600 } 
                    });
                    if (res.ok) {
                        const data = await res.json();
                        hydrateUniversal(data);
                    }
                } catch (error) {
                    console.error("Background fetch failed:", error);
                }
            };
            
            if ('requestIdleCallback' in window) {
                // @ts-ignore
                window.requestIdleCallback(fetchBackgroundData);
            } else {
                setTimeout(fetchBackgroundData, 2000);
            }
        }
    }, [isHomepage, universalData, hydrateUniversal]);

    useEffect(() => {
        if (universalData) {
            setShouldRender(true);
        }
    }, [universalData]);

    return (
        <>
            <AnimatePresence mode="wait">
                {isHomepage && !shouldRender && (
                    <SplashScreen key="splash" />
                )}
            </AnimatePresence>
            
            {shouldRender && universalData && (
                <UniversalBase data={universalData} />
            )}
        </>
    );
}