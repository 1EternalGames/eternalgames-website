// app/creators/[username]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByCreatorListQuery } from '@/lib/sanity.queries'; 
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import Link from 'next/link';
import { cache } from 'react';
import type { Metadata } from 'next';
import { enrichContentList } from '@/lib/enrichment';
import { unstable_cache } from 'next/cache';

export const dynamicParams = true;

type Props = {
  params: Promise<{ username: string }>;
};

// Optimized cached fetcher for creator page data
const getCachedCreatorData = unstable_cache(
    async (username: string) => {
        // 1. Get User
        const user = await prisma.user.findUnique({
            where: { username: username },
            select: { id: true, name: true, username: true, image: true }, 
        });
        if (!user) return null;

        // 2. Get Sanity IDs
        const creatorDocs = await client.fetch< { _id: string }[] >(
            `*[_type in ["author", "reviewer", "reporter", "designer"] && prismaUserId == $prismaUserId]{_id}`,
            { prismaUserId: user.id }
        );

        if (!creatorDocs || creatorDocs.length === 0) {
            return { user, items: [] };
        }
        
        const creatorIds = creatorDocs.map(doc => doc._id);
        
        // 3. Get Content
        const allItemsRaw = await client.fetch(allContentByCreatorListQuery, { creatorIds });

        // 4. Enrich Content
        const allItems = await enrichContentList(allItemsRaw);

        return { user, items: allItems };
    },
    ['creator-page-data'],
    { tags: ['content'] } // Revalidate on content change
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: encodedUsername } = await params;
  const username = decodeURIComponent(encodedUsername);
  
  const data = await getCachedCreatorData(username);
  if (!data || !data.user) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const title = `أعمال ${data.user.name || username}`;
  const description = `استكشف جميع مساهمات ${data.user.name || username} على منصة EternalGames.`;
  const ogImageUrl = data.user.image || `${siteUrl}/og-image.png`;
  const canonicalUrl = `/creators/${username}`;

  return {
    title,
    description,
    alternates: {
        canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalUrl}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: data.user.name || username }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export const generateStaticParams = cache(async () => {
    try {
        const usersWithUsernames = await prisma.user.findMany({
            where: {
                username: { not: null },
                roles: { some: { name: { in: ['REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'] } } }
            },
            select: { username: true },
        });

        return usersWithUsernames.map((user: any) => ({
            username: encodeURIComponent(user.username!),
        }));
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch usernames for creator pages.`, error);
        throw error;
    }
});

export default async function CreatorHubPage({ params }: { params: Promise<{ username: string }> }) {
    const { username: encodedUsername } = await params;
    const username = decodeURIComponent(encodedUsername);

    const data = await getCachedCreatorData(username);

    if (!data || !data.user) {
        notFound();
    }

    const { user, items: allItems } = data;

    if (!allItems || allItems.length === 0) {
        return (
             <div className="container page-container">
                <h1 className="page-title">{user.name || 'Creator'}</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم يُرَ لهذا المستخدمِ أثرٌ بعد.</p>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    {/* FIX: Disable prefetch on the empty state button */}
                    <Link href={`/profile/${user.username}`} className="primary-button" prefetch={false}>ملف المستخدم</Link>
                </div>
            </div>
        );
    }
    
    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={user.name || 'Creator'}
            hubType="أعمال"
            headerAction={
                // FIX: Disable prefetch on the main header button
                <Link 
                    href={`/profile/${user.username}`} 
                    className="outline-button no-underline" 
                    style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)', backdropFilter: 'blur(4px)' }} 
                    prefetch={false}
                >
                    → الملف الشخصي
                </Link>
            }
        />
    );
}


