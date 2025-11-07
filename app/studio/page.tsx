// app/studio/page.tsx

import { groq } from 'next-sanity';
import { StudioDashboard } from './StudioDashboard';
import { sanityWriteClient } from '@/lib/sanity.server'; // CORRECTED: Use server client
import { unstable_noStore as noStore } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';

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
    const userRoles = (session?.user as any)?.roles || [];
    
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
            ? await sanityWriteClient.fetch(allEditableContentQuery, { // CORRECTED: Use server client
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