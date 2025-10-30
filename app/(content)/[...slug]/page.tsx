// app/(content)/[...slug]/page.tsx
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

export const revalidate = 60;

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

async function enrichCreator(creator: any) {
    if (!creator || !creator.prismaUserId) return creator;
    try {
        const user = await prisma.user.findUnique({
            where: { id: creator.prismaUserId },
            select: { username: true, image: true, bio: true }
        });
        return {
            ...creator,
            username: user?.username || null,
            image: user?.image || null,
            bio: user?.bio || null,
        };
    } catch (error) {
        console.warn(`[BUILD WARNING] Database connection failed during creator enrichment for "${creator.name}". Skipping. Error:`, error);
        return creator;
    }
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
        // THE FIX: This function now ONLY fetches static data (comments).
        const comments = await prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } }, replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        // THE FIX: The session is no longer fetched here. It will be fetched on the client.
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