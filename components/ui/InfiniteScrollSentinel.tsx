// components/ui/InfiniteScrollSentinel.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function InfiniteScrollSentinel({ onIntersect }: { onIntersect: () => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting) {
                    onIntersect();
                }
            },
            {
                root: null, // null means the browser viewport, which works for both window and nested scroll containers
                rootMargin: '400px', // Trigger well before the bottom
                threshold: 0,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [onIntersect]);

    return <div ref={ref} style={{ height: '1px', width: '1px', pointerEvents: 'none', opacity: 0 }} aria-hidden="true" />;
}