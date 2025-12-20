// app/studio/page.tsx

import { groq } from 'next-sanity';
import { StudioDashboard } from './StudioDashboard';
import { sanityWriteClient } from '@/lib/sanity.server';
import { unstable_noStore as noStore } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const allEditableContentQuery = groq`
*[_type in $allowedTypes] | order(_updatedAt desc) {
    _id,
    _type,
    _updatedAt,
    title,
    "slug": slug.current,
    "status": select(
        _id in path("drafts.**") => "draft",
        _type == "gameRelease" => "published",
        defined(publishedAt) && publishedAt > now() => "scheduled",
        defined(publishedAt) && publishedAt < now() => "published",
        "draft"
    ),
    "mainImage": mainImage,
    "blurDataURL": mainImage.asset->metadata.lqip
}
`;

export default async function StudioPage() {
    noStore();
    
    const session = await getServerSession(authOptions);
    
    // THE DEFINITIVE FIX: Fetch fresh roles from DB
    let userRoles: string[] = [];
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({ 
            where: { id: session.user.id },
            select: { roles: { select: { name: true } } }
        });
        userRoles = user?.roles.map((r: any) => r.name) || [];
    }
    
    const isAdminOrDirector =
        userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

    const allowedContentTypes: string[] = [];

    if (isAdminOrDirector) {
        allowedContentTypes.push('review', 'article', 'news', 'gameRelease');
    } else {
        if (userRoles.includes('REVIEWER')) allowedContentTypes.push('review');
        if (userRoles.includes('AUTHOR')) allowedContentTypes.push('article');
        if (userRoles.includes('REPORTER')) allowedContentTypes.push('news');
    }

    if (allowedContentTypes.length === 0 && !userRoles.includes('DESIGNER')) {
        redirect('/');
    }

    const content =
        allowedContentTypes.length > 0
            ? await sanityWriteClient.fetch(allEditableContentQuery, {
                  allowedTypes: allowedContentTypes,
              })
            : [];

    return (
        <div className="container page-container">
            <StudioDashboard
                initialContent={content}
                userRoles={userRoles}
            />
        </div>
    );
}


