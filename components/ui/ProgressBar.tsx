// components/ui/ProgressBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Global event bus for the progress bar
type Listener = (state: boolean) => void;
let listeners: Listener[] = [];

const notify = (state: boolean) => listeners.forEach(l => l(state));

export const startNavigation = () => notify(true);
export const endNavigation = () => notify(false);

export default function ProgressBar() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handler = (state: boolean) => setIsLoading(state);
        listeners.push(handler);
        return () => { listeners = listeners.filter(l => l !== handler); };
    }, []);

    useEffect(() => {
        // Stop loading when route changes
        endNavigation();
    }, [pathname, searchParams]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 1 }}
                    animate={{ 
                        scaleX: 0.9, 
                        opacity: 1,
                        transition: { duration: 6, ease: "circOut" } // Slow fake progress
                    }}
                    exit={{ 
                        scaleX: 1, 
                        opacity: 0,
                        transition: { duration: 0.3 } 
                    }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: 'var(--accent)',
                        transformOrigin: 'left',
                        zIndex: 99999,
                        boxShadow: '0 0 15px var(--accent)'
                    }}
                />
            )}
        </AnimatePresence>
    );
}