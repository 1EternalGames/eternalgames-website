// app/(content)/[...slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { client } from '@/lib/sanity.client';
import dynamic from 'next/dynamic';
import {
    reviewBySlugQuery, latestReviewsFallbackQuery,
    articleBySlugQuery, latestArticlesFallbackQuery,
    newsBySlugQuery, latestNewsFallbackQuery
} from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ContentPageClient from '@/components/content/ContentPageClient';
import { Suspense } from 'react';

export const revalidate = 60;

// MAINTAINED: The entire comment section will only be loaded when it is about to be scrolled into view.
const CommentSection = dynamic(() => import('@/components/comments/CommentSection'), {
    loading: () => <div className="spinner" style={{ margin: '8rem auto' }} />,
    ssr: false, // The component fetches session client-side, making SSR unnecessary.
});

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

    return {
        ...creator,
        ...userDetails,
    };
}


export async function generateStaticParams() {
    try {
        const allContent = await client.fetch<any[]>(`*[_type in ["review", "article", "news"]]{ "slug": slug.current, _type }`);
        return allContent.filter(c => c.slug).map(c => {
            const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
            return { slug: [type, c.slug] };
        });
    } catch (error) {
        console.warn(`[BUILD WARNING] Failed to fetch slugs for generateStaticParams. This may be due to a network or API issue. Skipping static generation for content pages. Error:`, error);
        return [];
    }
}

async function Comments({ slug }: { slug: string }) {
    try {
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } }, replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        // Renders the lazy-loaded component with its initial server-fetched data.
        return <CommentSection slug={slug} initialComments={comments} />;
    } catch (error) {
        console.warn(`[BUILD WARNING] Database connection failed while pre-rendering comments for slug "${slug}". Skipping.`, (error as any)?.digest || error);
        return <CommentSection slug={slug} initialComments={[]} />;
    }
}

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    
    if (!slugArray || slugArray.length !== 2) {
        notFound();
    }
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];

    if (!config) {
        notFound();
    }

    let item: any = await client.fetch(config.query, { slug });
    if (!item) {
        notFound();
    }

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await client.fetch(config.fallbackQuery, { currentId: item._id });
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