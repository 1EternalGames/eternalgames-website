// app/reviews/[slug]/page.tsx
import { client } from '@/lib/sanity.client';
import { reviewBySlugQuery, latestReviewsFallbackQuery } from '@/lib/sanity.queries';
import type { SanityReview } from '@/types/sanity';
import { notFound } from 'next/navigation';
import ReviewPageClient from './ReviewPageClient';
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
    const reviews = await client.fetch<any[]>(`*[_type == "مراجعة"]{ "slug": slug.current }`);
    return reviews.filter(r => r.slug).map(r => ({ slug: r.slug }));
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

export default async function ReviewPage({ params, searchParams }: { params: { slug: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    
    let reviewData: any = await client.fetch(reviewBySlugQuery, { slug });
    if (!reviewData) { notFound(); }

    // Enrich creator data with usernames from Prisma
    if (reviewData.authors) {
        reviewData.authors = await Promise.all(reviewData.authors.map(enrichCreator));
    }
    if (reviewData.designers) {
        reviewData.designers = await Promise.all(reviewData.designers.map(enrichCreator));
    }
    
    const review: SanityReview = { ...reviewData, slug: reviewData.slug.current };

    if (!review.relatedReviews || review.relatedReviews.length === 0) {
        review.relatedReviews = await client.fetch(latestReviewsFallbackQuery, { currentId: review._id });
    }
    
    return (
        <ReviewPageClient review={review} searchParams={searchParams}>
            <Suspense fallback={<div className="spinner" style={{margin: '8rem auto'}} />}>
                {/* @ts-expect-error Async Server Component */}
                <Comments slug={slug} />
            </Suspense>
        </ReviewPageClient>
    );
}


