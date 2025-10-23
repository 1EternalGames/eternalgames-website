// app/creators/[username]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByCreatorListQuery } from '@/lib/sanity.queries';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import Link from 'next/link';

export default async function CreatorHubPage({ params }: { params: { username: string } }) {
    const username = decodeURIComponent(params.username);

    const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true, name: true, username: true },
    });

    if (!user) {
        notFound();
    }

    // Find all Sanity creator documents linked to this Prisma user ID
    const creatorDocs = await client.fetch< { _id: string }[] >(
        `*[_type in ["author", "reviewer", "reporter", "designer"] && prismaUserId == $prismaUserId]{_id}`,
        { prismaUserId: user.id }
    );

    // If the user has no corresponding creator documents in Sanity, they have no content.
    if (!creatorDocs || creatorDocs.length === 0) {
        return (
             <div className="container page-container">
                <h1 className="page-title">{user.name || 'Creator'}</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم ينشر هذا المستخدم أي محتوى عام بعد.</p>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <Link href={`/profile/${user.username}`} className="primary-button">عرض الملف الشخصي للمستخدم</Link>
                </div>
            </div>
        );
    }
    
    // Extract the _id's into an array
    const creatorIds = creatorDocs.map(doc => doc._id);
    
    // Fetch all content that references any of these creator IDs
    const allItems = await client.fetch(allContentByCreatorListQuery, { 
        creatorIds: creatorIds
    });

    return (
        <HubPageClient
            initialItems={allItems}
            hubTitle={user.name || 'Creator'}
            hubType="أعمال"
            headerAction={
                <Link href={`/profile/${user.username}`} className="outline-button no-underline" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)', backdropFilter: 'blur(4px)' }}>
                    → عرض الملف الشخصي
                </Link>
            }
        />
    );
}


