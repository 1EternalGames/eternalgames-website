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
import { cache } from 'react';
import { groq } from 'next-sanity';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';

const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

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

type Props = {
  params: { slug: string[] };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: slugArray } = params;
  if (!slugArray || slugArray.length !== 2) return {};
  
  const [type, slug] = slugArray;
  const config = (contentConfig as any)[type];
  if (!config) return {};

  const item = await getCachedSanityData(config.query, { slug });
  if (!item) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const ogImageUrl = urlFor(item.mainImage).width(1200).height(630).fit('crop').format('jpg').url(); // Added .format('jpg')

  let description = 'اقرأ المزيد على EternalGames.';
  if (item._type === 'review' && item.verdict) {
    description = item.verdict;
  } else if (item.content) {
    const firstTextblock = item.content.find((block: any) => block._type === 'block' && block.children?.some((child: any) => child.text));
    if (firstTextblock) {
      description = firstTextblock.children.map((child: any) => child.text).join(' ').slice(0, 155) + '...';
    }
  }

  return {
    title: item.title,
    description: description,
    openGraph: {
      title: item.title,
      description: description,
      url: `${siteUrl}/${type}/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
      type: 'article',
      publishedTime: item.publishedAt,
      authors: (item.authors || item.reporters || []).map((a: any) => a.name),
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: description,
      images: [ogImageUrl],
    },
  };
}


const getCachedSanityData = unstable_cache(
    async (query: string, params: Record<string, any> = {}) => {
        return client.fetch(query, params);
    },
    ['sanity-content-detail'],
    {
        tags: ['sanity-content-detail']
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
    { tags: ['enriched-creator-details'] }
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

export default async function ContentPage({ params }: { params: { slug: string[] } }) {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [type, slug] = slugArray;
    const config = (contentConfig as any)[type];
    if (!config) notFound();

    let [item, colorDictionaryData]: [any, { autoColors: any[] }?] = await Promise.all([
        getCachedSanityData(config.query, { slug }),
        getCachedSanityData(colorDictionaryQuery)
    ]);
    
    if (!item) notFound();

    if (!item[config.relatedProp] || item[config.relatedProp].length === 0) {
        const fallbackContent = await getCachedSanityData(config.fallbackQuery, { currentId: item._id });
        item[config.relatedProp] = fallbackContent;
    }

    for (const prop of config.creatorProps) {
        if (item[prop]) {
            item[prop] = await Promise.all(item[prop].map(enrichCreator));
        }
    }
    
    const colorDictionary = colorDictionaryData?.autoColors || [];

    return (
        <ContentPageClient item={item} type={type as any} colorDictionary={colorDictionary}>
            <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}>
                <CommentSection slug={slug} />
            </Suspense>
        </ContentPageClient>
    );
}