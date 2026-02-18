// app/studio/analytics/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/auth';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// --- Sanity & Prisma Stats ---
export async function getAnalyticsSummary() {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR')) throw new Error('Unauthorized');

    const [userCount, commentCount, engagementCount, shareCount] = await Promise.all([
        prisma.user.count(),
        prisma.comment.count(),
        prisma.engagement.count(),
        prisma.share.count(),
    ]);

    return { users: userCount, comments: commentCount, engagements: engagementCount, shares: shareCount };
}

// OLD: Simple total counts (kept for fallback/init)
export async function getContentCounts() {
    try {
        const session = await getAuthenticatedSession();
        if (!session.user.roles.includes('DIRECTOR')) throw new Error('Unauthorized');
        
        const query = groq`{
            "reviews": count(*[_type == "review"]),
            "articles": count(*[_type == "article"]),
            "news": count(*[_type == "news"]),
            "releases": count(*[_type == "gameRelease"])
        }`;
        return await client.fetch(query);
    } catch (error) {
        console.error("Failed to fetch Sanity content counts:", error);
        return { reviews: 0, articles: 0, news: 0, releases: 0 };
    }
}

// NEW: Date-range specific content counts
export async function getContentProductionStats(startDateStr: string, endDateStr: string) {
    try {
        const session = await getAuthenticatedSession();
        if (!session.user.roles.includes('DIRECTOR')) throw new Error('Unauthorized');

        // Note: For releases we use releaseDate, for others publishedAt
        const query = groq`{
            "reviews": count(*[_type == "review" && publishedAt >= $startDate && publishedAt <= $endDate]),
            "articles": count(*[_type == "article" && publishedAt >= $startDate && publishedAt <= $endDate]),
            "news": count(*[_type == "news" && publishedAt >= $startDate && publishedAt <= $endDate]),
            "releases": count(*[_type == "gameRelease" && releaseDate >= $startDate && releaseDate <= $endDate])
        }`;

        const data = await client.fetch(query, { startDate: startDateStr, endDate: endDateStr });
        return data;
    } catch (error) {
        console.error("Failed to fetch content production stats:", error);
        return { reviews: 0, articles: 0, news: 0, releases: 0 };
    }
}

// --- Google Analytics ---

const cleanEnvVar = (val: string | undefined) => {
    if (!val) return '';
    return val.trim().replace(/^["']|["']$/g, '');
};

export async function fetchGoogleAnalytics(dateRange: '7d' | '28d' | '90d' = '28d') {
    try {
        const session = await getAuthenticatedSession();
        if (!session.user.roles.includes('DIRECTOR')) throw new Error('Unauthorized');
        
        const rawEmail = cleanEnvVar(process.env.GA_CLIENT_EMAIL);
        const rawKey = cleanEnvVar(process.env.GA_PRIVATE_KEY);
        const rawId = cleanEnvVar(process.env.GA_PROPERTY_ID);

        const privateKey = rawKey.includes('\\n') 
            ? rawKey.replace(/\\n/g, '\n') 
            : rawKey;

        const propertyId = rawId.replace(/^properties\//, '');

        if (!rawEmail || !privateKey || !propertyId) {
            return { error: 'Missing GA credentials.' };
        }

        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: { client_email: rawEmail, private_key: privateKey },
        });

        const startDateMap = { '7d': '7daysAgo', '28d': '28daysAgo', '90d': '90daysAgo' };
        const startDate = startDateMap[dateRange];

        const [
            realtimeReport,
            trendReport,
            acquisitionReport,
            pagesReport,
            geoReport,
            eventsReport,
            devicesReport,
            osReport // NEW: Operating System Report
        ] = await Promise.all([
            // 1. Realtime
            analyticsDataClient.runRealtimeReport({
                property: `properties/${propertyId}`,
                dimensions: [{ name: 'country' }],
                metrics: [{ name: 'activeUsers' }],
            }),
            // 2. Trend
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }],
            }),
            // 3. Acquisition
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'sessionDefaultChannelGroup' }],
                metrics: [{ name: 'activeUsers' }],
            }),
            // 4. Pages
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
                limit: 100,
            }),
            // 5. Geo
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'country' }, { name: 'countryId' }],
                metrics: [{ name: 'activeUsers' }],
                limit: 100,
            }),
            // 6. Events
             analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
                limit: 100,
            }),
            // 7. Devices (Category)
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'activeUsers' }],
            }),
            // 8. Devices (OS)
            analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate: 'today' }],
                dimensions: [{ name: 'operatingSystem' }],
                metrics: [{ name: 'activeUsers' }],
            })
        ]);
        
        const realtimeTotal = realtimeReport[0].rows?.reduce((acc, row) => acc + parseInt(row.metricValues?.[0]?.value || '0', 10), 0) || 0;

        const trendData = trendReport[0].rows?.map(row => {
            const d = row.dimensionValues?.[0]?.value || '';
            const dateStr = `${d.substring(4,6)}/${d.substring(6,8)}`;
            return {
                date: dateStr,
                users: parseInt(row.metricValues?.[0]?.value || '0', 10),
                sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
            };
        }) || [];

        const acquisitionData = acquisitionReport[0].rows?.map(row => ({
            name: row.dimensionValues?.[0]?.value || 'Unknown',
            value: parseInt(row.metricValues?.[0]?.value || '0', 10)
        })).sort((a,b) => b.value - a.value) || [];

        const pagesData = pagesReport[0].rows?.map(row => ({
            title: row.dimensionValues?.[0]?.value || 'Unknown',
            path: row.dimensionValues?.[1]?.value || '/',
            views: parseInt(row.metricValues?.[0]?.value || '0', 10),
            users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        })).sort((a,b) => b.views - a.views) || [];

        const geoData = geoReport[0].rows?.map(row => ({
            country: row.dimensionValues?.[0]?.value || 'Unknown',
            iso: row.dimensionValues?.[1]?.value || '',
            users: parseInt(row.metricValues?.[0]?.value || '0', 10)
        })).sort((a,b) => b.users - a.users) || [];

        const eventsData = eventsReport[0].rows?.map(row => ({
            name: row.dimensionValues?.[0]?.value || 'Unknown',
            count: parseInt(row.metricValues?.[0]?.value || '0', 10)
        })).sort((a,b) => b.count - a.count) || [];

        const devicesCategoryData = devicesReport[0].rows?.map(row => ({
            name: row.dimensionValues?.[0]?.value || 'Unknown',
            value: parseInt(row.metricValues?.[0]?.value || '0', 10)
        })).sort((a,b) => b.value - a.value) || [];

        const devicesOSData = osReport[0].rows?.map(row => ({
            name: row.dimensionValues?.[0]?.value || 'Unknown',
            value: parseInt(row.metricValues?.[0]?.value || '0', 10)
        })).sort((a,b) => b.value - a.value) || [];

        return {
            realtime: realtimeTotal,
            trend: trendData,
            acquisition: acquisitionData,
            pages: pagesData,
            geo: geoData,
            events: eventsData,
            devices: {
                category: devicesCategoryData,
                os: devicesOSData
            }
        };

    } catch (e: any) {
        console.error("GA API Error:", e);
        if (e.message?.includes('7 PERMISSION_DENIED')) {
            return { error: 'Permission Denied: Check GA Admin Settings.' };
        }
        return { error: e.message || "Failed to connect to Google Analytics" };
    }
}