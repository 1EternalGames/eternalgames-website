// app/articles/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { articleBySlugQuery, latestArticlesFallbackQuery } from '@/lib/sanity.queries';
import type { SanityArticle } from '@/types/sanity';
import { notFound } from 'next/navigation';
import ArticlePageClient from './ArticlePageClient';
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
    const articles = await client.fetch<any[]>(`*[_type == "مقالة"]{ "slug": slug.current }`);
    return articles.filter(a => a.slug).map(a => ({ slug: a.slug }));
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

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    let article: SanityArticle = await client.fetch(articleBySlugQuery, { slug });

    if (!article) {
        notFound();
    }

    // Add related articles fallback logic
    if (!article.relatedArticles || article.relatedArticles.length === 0) {
        const fallbackArticles = await client.fetch(latestArticlesFallbackQuery, { currentId: article._id });
        article.relatedArticles = fallbackArticles;
    }
    
    // Enrich creator data
    if (article.authors) {
        article.authors = await Promise.all(article.authors.map(enrichCreator));
    }
    if (article.designers) {
        article.designers = await Promise.all(article.designers.map(enrichCreator));
    }

    return (
        <ArticlePageClient 
            article={article}
            comments={
                <Suspense fallback={<div className="spinner" style={{margin: '8rem auto'}} />}>
                    {/* @ts-expect-error Async Server Component */}
                    <Comments slug={slug} />
                </Suspense>
            }
        />
    );
}


