// app/constellation/ConstellationPageClient.tsx
'use client';

import dynamic from 'next/dynamic';

const ConstellationLoader = dynamic(() => import('@/components/constellation/ConstellationLoader'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '60px', height: '60px' }} />
        </div>
    ),
});

export default function ConstellationPageClient() {
    return (
        <div style={{ paddingTop: 'var(--nav-height-scrolled)' }}>
            <ConstellationLoader />
        </div>
    );
}


