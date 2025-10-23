// components/constellation/ConstellationLoader.tsx
'use client';

import dynamic from 'next/dynamic';

// This is the correct location for the dynamic import with ssr: false.
const Constellation = dynamic(() => import('@/components/constellation'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
        </div>
    ),
});

// This simple wrapper component is safely imported by the Client Component.
export default function ConstellationLoader() {
    return <Constellation />;
}


