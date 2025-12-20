// app/welcome/page.tsx
import { Suspense } from 'react';
import WelcomePageClient from './WelcomePageClient';

// A simple fallback component to show while the client component loads
const WelcomePageFallback = () => {
    return (
        <div className="container page-container" style={{display: 'flex', alignItems:'center', justifyContent: 'center'}}>
            <div className="spinner" />
        </div>
    );
};

export default function WelcomePage() {
    return (
        <Suspense fallback={<WelcomePageFallback />}>
            <WelcomePageClient />
        </Suspense>
    );
}





