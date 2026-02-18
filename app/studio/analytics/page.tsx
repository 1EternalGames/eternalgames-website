// app/studio/analytics/page.tsx
import { getAnalyticsSummary, getContentCounts } from './actions';
import AnalyticsClient from './AnalyticsClient';
import { Metadata } from 'next';
import { getAuthenticatedSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'تحليلات المنصة',
    description: 'لوحة قيادة البيانات الداخلية.',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const session = await getAuthenticatedSession();
    
    if (!session.user.roles.includes('DIRECTOR')) {
        redirect('/studio');
    }

    // Fetch all data in parallel
    const [prismaStats, sanityStats] = await Promise.all([
        getAnalyticsSummary(),
        getContentCounts(),
    ]);

    const combinedData = {
        prisma: prismaStats,
        sanity: sanityStats
    };
    
    const vercelConfig = {
        projectId: process.env.VERCEL_PROJECT_ID,
        teamId: process.env.VERCEL_TEAM_ID,
    };

    // The Google Analytics data will be fetched on the client-side
    // to provide instant loading for the static data first.

    return (
        <div className="container page-container">
            <AnalyticsClient data={combinedData} vercelConfig={vercelConfig} />
        </div>
    );
}