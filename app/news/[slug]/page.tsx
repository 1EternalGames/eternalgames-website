// app/news/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { newsBySlugQuery, latestNewsFallbackQuery } from '@/lib/sanity.queries';
import type { SanityNews } from '@/types/sanity';
import { notFound } from 'next/navigation';
import NewsPageClient from './NewsPageClient';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CommentSection from '@/components/comments/CommentSection';
import { Suspense } from 'react';

export const revalidate = 60;

// Enrich creator with prisma username, image, and bio
async function enrichCreator(creator: any) {
    if (!creator || !creator.prismaUserId) return creator;
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
}

export async function generateStaticParams() {
    const newsItems = await client.fetch<any[]>(`*[_type == "خبر"]{ "slug": slug.current }`);
    return newsItems.filter(item => item.slug).map(item => ({ slug: item.slug }));
}

async function Comments({ slug }: { slug: string }) {
    const [comments, session] = await Promise.all([
        prisma.comment.findMany({
            where: { contentSlug: slug, parentId: null },
            include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } }, replies: { take: 2, include: { author: { select: { id: true, name: true, image: true, username: true } }, votes: true, _count: { select: { replies: true } } }, orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        }),
        getServerSession(authOptions)
    ]);
    return <CommentSection slug={slug} initialComments={comments} session={session} />;
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    let newsItem: SanityNews & { relatedNews?: any[] } = await client.fetch(newsBySlugQuery, { slug });

    if (!newsItem) {
        notFound();
    }
    
    // Enrich creator data
    if (newsItem.reporters) {
        newsItem.reporters = await Promise.all(newsItem.reporters.map(enrichCreator));
    }
    if (newsItem.designers) {
        newsItem.designers = await Promise.all(newsItem.designers.map(enrichCreator));
    }

    if (!newsItem.relatedNews || newsItem.relatedNews.length === 0) {
        const fallbackNews = await client.fetch(latestNewsFallbackQuery, { 
            currentId: newsItem._id
        });
        newsItem.relatedNews = fallbackNews;
    }

    return (
        <NewsPageClient newsItem={newsItem}>
            <Suspense fallback={<div className="spinner" style={{margin: '8rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <Comments slug={slug} />
            </Suspense>
        </NewsPageClient>
    );
}


