// app/constellation/page.tsx
'use client'; // This page is now the client component boundary

import dynamic from 'next/dynamic';

// The chain of loaders has been removed. We now handle the dynamic import directly on the page.
const Constellation = dynamic(() => import('@/components/constellation'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '60px', height: '60px' }} />
        </div>
    ),
});

export default function ConstellationPage() {
    return (
        <div style={{ paddingTop: 'var(--nav-height-scrolled)' }}>
            <Constellation />
        </div>
    );
}


