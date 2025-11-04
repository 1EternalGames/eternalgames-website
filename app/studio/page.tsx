// app/studio/page.tsx

import { createClient } from 'next-sanity';
import { groq } from 'next-sanity';
import { StudioDashboard } from './StudioDashboard';
import { projectId, dataset, apiVersion } from '@/lib/sanity.client';
import { unstable_noStore as noStore } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';

const studioClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
});

const allEditableContentQuery = groq`
*[_type in $allowedTypes] | order(_updatedAt desc) {
    _id,
    _type,
    _updatedAt,
    title,
    "slug": slug.current,
    "status": select(
        _type == "gameRelease" => "published",
        defined(publishedAt) && publishedAt < now() => "published",
        !defined(publishedAt) => "draft",
        "scheduled"
    ),
    "mainImage": mainImage,
    "blurDataURL": mainImage.asset->metadata.lqip
}
`;

export default async function StudioPage() {
    noStore();
    
    const session = await getServerSession(authOptions);
    const userRoles = (session?.user as any)?.roles || [];
    
    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
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

    const content = allowedContentTypes.length > 0
        ? await studioClient.fetch(allEditableContentQuery, { allowedTypes: allowedContentTypes })
        : [];

    return (
        <div className="container page-container">
            <StudioDashboard initialContent={content} userRoles={userRoles} />
        </div>
    );
}