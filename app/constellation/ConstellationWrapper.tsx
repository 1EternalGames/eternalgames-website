// app/constellation/ConstellationWrapper.tsx
'use client';

import dynamic from 'next/dynamic';
import type { SanityContentObject } from '@/components/constellation/config';

type InitialData = {
    userContent: SanityContentObject[];
    commentedSlugs: string[];
    isGuest: boolean;
} | null;

// Move the dynamic import here, inside a "use client" file
const Constellation = dynamic(() => import('@/components/constellation'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - var(--nav-height-scrolled))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '60px', height: '60px' }} />
        </div>
    ),
});

export default function ConstellationWrapper({ initialData }: { initialData: InitialData }) {
    return <Constellation initialData={initialData} />;
}