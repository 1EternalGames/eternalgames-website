// app/(content)/[...slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { client } from '@/lib/sanity.client';
import {
    reviewBySlugQuery, latestReviewsFallbackQuery,
    articleBySlugQuery, latestArticlesFallbackQuery,
    newsBySlugQuery, latestNewsFallbackQuery
} from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/comments/CommentSection';
import ContentPageClient from '@/components/content/ContentPageClient';
import { Suspense } from 'react';
import { cache } from 'react'; // Import React's cache

const contentConfig = {
    reviews: {
        query: reviewBySlugQuery,
        fallbackQuery: latestReviewsFallbackQuery,
        relatedProp: 'relatedReviews',
        creatorProps: ['authors', 'designers'],
        sanityType: 'review',
    },
    articles: {
        query: articleBySlugQuery,
        fallbackQuery: latestArticlesFallbackQuery,
        relatedProp: 'relatedArticles',
        creatorProps: ['authors', 'designers'],
        sanityType: 'article',
    },
    news: {
        query: newsBySlugQuery,
        fallbackQuery: latestNewsFallbackQuery,
        relatedProp: 'relatedNews',
        creatorProps: ['reporters', 'designers'],
        sanityType: 'news',
    },
};

// MODIFIED: Caching function for all server-side Sanity fetches
const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
    {
        // The time-based 'revalidate: 3600' has been removed to restore pure SSG.
        // Revalidation will now be handled on-demand by the Sanity webhook.
        tags: ['sanity-content']
    }
);

const getCachedCreatorDetails = unstable_cache(
    async (prismaUserId: string) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: prismaUserId },
                select: { username: true, image: true, bio: true }
            });
            return {
                username: user?.username || null,
                image: user?.image || null,
                bio: user?.bio || null,
            };
        } catch (error) {
            console.warn(`[CACHE WARNING] Database connection failed for creator enrichment (ID: ${prismaUserId}). Skipping. Error:`, error);
            return { username: null, image: null, bio: null };
        }
    },
    ['enriched-creator-details'],
    { revalidate: 3600 }
);

async function enrichCreator(creator: any) {
    if (!creator || !creator.prismaUserId) return creator;
    const userDetails = await getCachedCreatorDetails(creator.prismaUserId);
    return { ...creator, ...userDetails };
}

export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
        return allContent.filter(c => c.slug).map(c => {
            const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for generateStaticParams. The build process cannot continue without a connection to the CMS.`, error);
        throw error;
    }
}

const getCachedComments = cache(async (slug: string) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { 
                author: { select: { id: true, name: true, image: true, username: true } }, 
                votes: true, 
                _count: { select: { replies: true } }, 
                replies: { 
                    take: 2, 
                    include: { 
                        author: { select: { id: true, name: true, image: true, username: true } }, 
                        votes: true, 
                        _count: { select: { replies: true } } 
                    }, 
                    orderBy: { createdAt: 'asc' } 
                } 
            },
            orderBy: { createdAt: 'desc' },
        });
        return comments;
    } catch (error) {
        console.warn(`[BUILD WARNING] Database connection failed while pre-rendering comments for slug "${slug}". Skipping.`, (error as any)?.digest || error);
        return [];
    }
});

async function Comments({ slug }: { slug: string }) {
    const comments = await getCachedComments(slug);
    return <CommentSection slug={slug} initialComments={comments} />;
}

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    if (!config) notFound();

    // MODIFIED: Using the cached Sanity fetch function
    let item: any = await getCachedSanityData(config.query, { slug });
    if (!item) notFound();

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        // MODIFIED: Using the cached Sanity fetch function for fallback
        const fallbackContent = await getCachedSanityData(config.fallbackQuery, { currentId: item._id });
        item[config.relatedProp] = fallbackContent;
    }

    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop] = await Promise.all(item[prop].map(enrichCreator));
        }
    }

    return (
        <ContentPageClient item={item} type={type as any}>
            <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}>
                <Comments slug={slug} />
            </Suspense>
        </ContentPageClient>
    );
}