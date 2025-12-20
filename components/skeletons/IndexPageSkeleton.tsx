// components/skeletons/IndexPageSkeleton.tsx
import React from 'react';
import HeroSkeleton from './HeroSkeleton';
import GridPageSkeleton from './GridPageSkeleton';

export default function IndexPageSkeleton({ heroVariant = 'center' }: { heroVariant?: 'center' | 'news' }) {
    return (
        <>
            <HeroSkeleton variant={heroVariant} />
            <div className="container" style={{ paddingTop: '4rem' }}>
                {/* Filter Bar Skeleton */}
                <div style={{ 
                    display: 'flex', 
                    gap: '1.5rem', 
                    marginBottom: '4rem', 
                    padding: '2.5rem',
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px' 
                }}>
                    <div style={{ width: '30%', height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '8px', opacity: 0.5 }}></div>
                    <div style={{ width: '15%', height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '999px', opacity: 0.5 }}></div>
                    <div style={{ width: '15%', height: '40px', backgroundColor: 'var(--border-color)', borderRadius: '999px', opacity: 0.5 }}></div>
                </div>
                
                <GridPageSkeleton count={12} />
            </div>
        </>
    );
}


