// app/constellation/page.tsx
import ConstellationPageClient from './ConstellationPageClient';

// This is a Server Component. Its only job is to render the client boundary.
export default function ConstellationPage() {
    return <ConstellationPageClient />;
}


