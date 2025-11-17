// app/creators/[username]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByCreatorListQuery } from '@/lib/sanity.queries';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import Link from 'next/link';
import { cache } from 'react'; // Import React's cache

export const dynamicParams = true; // <--- ADDED THIS LINE

export const generateStaticParams = cache(async () => {
    try {
        const usersWithUsernames = await prisma.user.findMany({
            where: {
                username: { not: null },
                roles: { some: { name: { in: ['REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'] } } }
            },
            select: { username: true },
        });

        return usersWithUsernames.map((user) => ({
            username: encodeURIComponent(user.username!),
        }));
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch usernames for creator pages. Build cannot continue.`, error);
        throw error;
    }
});

const getCachedUserByUsername = cache(async (username: string) => {
    try {
        return await prisma.user.findUnique({
            where: { username: username },
            select: { id: true, name: true, username: true },
        });
    } catch (error) {
        console.warn(`[BUILD WARNING] Database connection failed for creator page: "${username}".`, error);
        return null;
    }
});

export default async function CreatorHubPage({ params }: { params: { username: string } }) {
    const { username: encodedUsername } = await params;
    const username = decodeURIComponent(encodedUsername);

    const user = await getCachedUserByUsername(username);

    if (!user) {
        notFound();
    }

    const creatorDocs = await client.fetch< { _id: string }[] >(
        `*[_type in ["author", "reviewer", "reporter", "designer"] && prismaUserId == $prismaUserId]{_id}`,
        { prismaUserId: user.id }
    );

    if (!creatorDocs || creatorDocs.length === 0) {
        return (
             <div className="container page-container">
                <h1 className="page-title">{user.name || 'Creator'}</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم يُرَ لهذا المستخدمِ أثرٌ بعد.</p>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <Link href={`/profile/${user.username}`} className="primary-button">ملف المستخدم</Link>
                </div>
            </div>
        );
    }
    
    const creatorIds = creatorDocs.map(doc => doc._id);
    const allItems = await client.fetch(allContentByCreatorListQuery, { creatorIds });

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={user.name || 'Creator'}
            hubType="أعمال"
            headerAction={
                <Link href={`/profile/${user.username}`} className="outline-button no-underline" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)', backdropFilter: 'blur(4px)' }}>
                    → الملف الشخصي
                </Link>
            }
        />
    );
}