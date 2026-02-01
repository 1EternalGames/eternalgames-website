// app/studio/page.tsx

import { groq } from 'next-sanity';
import { StudioDashboard } from './StudioDashboard';
import { sanityWriteClient } from '@/lib/sanity.server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

// FORCE DYNAMIC: Ensure the dashboard list is always fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const session = await getServerSession(authOptions);
    
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

    // CRITICAL FIX: Added no-store cache option to dashboard list fetch
    const content =
        allowedContentTypes.length > 0
            ? await sanityWriteClient.fetch(
                  allEditableContentQuery, 
                  { allowedTypes: allowedContentTypes },
                  { cache: 'no-store', next: { revalidate: 0 } }
              )
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