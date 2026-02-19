// app/(content)/[...slug]/page.tsx
import { notFound } from 'next/navigation';
import ContentPageClient from '@/components/content/ContentPageClient';
import CommentSection from '@/components/comments/CommentSection';
import type { Metadata } from 'next';
import { getCachedContentAndDictionary, getCachedMetadata } from '@/lib/sanity.fetch';
import { client } from '@/lib/sanity.client'; 
import { enrichContentList } from '@/lib/enrichment'; 
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd'; 
import SpeakableJsonLd from '@/components/seo/SpeakableJsonLd'; 
import { urlFor } from '@/sanity/lib/image';
import { calculateReadingTime, toPlainText } from '@/lib/readingTime'; 
import { extractHeadingsFromContent } from '@/lib/text-utils'; 
import { groq } from 'next-sanity';

// Allow ISR for pages not generated at build time (e.g. older archives)
export const dynamicParams = true;

const typeMap: Record<string, string> = {
    reviews: 'review',
    articles: 'article',
    news: 'news',
};

const sectionLabelMap: Record<string, string> = {
    reviews: 'المراجعات',
    articles: 'المقالات',
    news: 'الأخبار',
};

function generateStructuredData(item: any, type: string, url: string) {
    // UPDATE: Changed base URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';
    const imageUrl = item.mainImage ? urlFor(item.mainImage).width(1200).height(630).url() : `${siteUrl}/og.png`;
    const datePublished = item.publishedAt || new Date().toISOString();
    const dateModified = item._updatedAt || datePublished;
    
    const authorName = item.authors?.[0]?.name || item.reporters?.[0]?.name || 'EternalGames Team';
    const authorUsername = item.authors?.[0]?.username || item.reporters?.[0]?.username || 'team';
    const authorUrl = `${siteUrl}/creators/${authorUsername}`;

    const baseSchema = {
        "@context": "https://schema.org",
        "@type": type === 'review' ? "Review" : "NewsArticle",
        "headline": item.title,
        "image": [imageUrl],
        "datePublished": datePublished,
        "dateModified": dateModified,
        "mainEntityOfPage": {
             "@type": "WebPage",
             "@id": url
        },
        "author": [{
            "@type": "Person",
            "name": authorName,
            "url": authorUrl
        }],
        "publisher": {
            "@type": "Organization",
            "name": "EternalGames",
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/icon.svg`
            }
        }
    };

    if (type === 'review') {
        return {
            ...baseSchema,
            "itemReviewed": {
                "@type": "VideoGame",
                "name": item.game?.title || "Game",
                "applicationCategory": "Game"
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": item.score,
                "bestRating": "10",
                "worstRating": "0"
            },
            "description": item.synopsis || item.verdict,
            "positiveNotes": item.pros ? {
                "@type": "ItemList",
                "itemListElement": item.pros.map((p: string, i: number) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": p
                }))
            } : undefined,
            "negativeNotes": item.cons ? {
                "@type": "ItemList",
                "itemListElement": item.cons.map((c: string, i: number) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": c
                }))
            } : undefined
        };
    }

    if (type === 'news') {
        return {
            ...baseSchema,
            "@type": "NewsArticle",
            "description": item.synopsis
        };
    }

    return {
        ...baseSchema,
        "@type": "Article",
        "description": item.synopsis
    };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug: slugArray } = await params;
    if (!slugArray || slugArray.length < 2) return {};
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    if (!sanityType) return {};
    
    const item = await getCachedMetadata(slug);

    if (!item) return {};
    
    // UPDATE: Changed base URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';
    const ogImageUrl = `${siteUrl}/api/og?slug=${slug}`;
    const canonicalUrl = `${siteUrl}/${section}/${slug}`;

    return { 
        title: item.title, 
        description: item.synopsis || `Read the full ${sanityType} on EternalGames.`,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: item.title,
            description: item.synopsis,
            url: canonicalUrl,
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: item.title }],
            type: 'article',
            publishedTime: item.publishedAt,
            authors: [item.authors?.[0]?.name || 'EternalGames'],
            siteName: 'EternalGames',
            modifiedTime: item._updatedAt, 
        },
        twitter: {
            card: 'summary_large_image',
            title: item.title,
            description: item.synopsis,
            images: [ogImageUrl],
            site: '@1EternalGames',
        }
    };
}

export async function generateStaticParams() {
    try {
        // OPTIMIZATION: Only generate the 100 most recent items at build time.
        // Older items will be generated on-demand (ISR) when accessed.
        // This dramatically reduces build time and prevents timeouts/memory issues.
        const query = groq`*[_type in ["review", "article", "news"]] | order(_createdAt desc)[0...100] { "slug": slug.current, _type }`;
        const recentContent = await client.fetch<{ slug: string, _type: string }[]>(query);
        
        return recentContent
            .filter(c => c.slug)
            .map(c => {
                const type = c._type === 'review' ? 'reviews' : (c._type === 'article' ? 'articles' : 'news');
                return { slug: [type, c.slug] };
            });
    } catch (error) {
        console.error("Error generating static params:", error);
        return [];
    }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug: slugArray } = await params;
    
    if (!slugArray || slugArray.length !== 2) notFound();
    
    const [section, slug] = slugArray;
    const sanityType = typeMap[section];
    
    if (!sanityType) notFound();

    const { item: rawItem, dictionary } = await getCachedContentAndDictionary(sanityType, slug);
    
    if (!rawItem) notFound();

    const [enrichedItem] = await enrichContentList([rawItem]);

    const plainText = toPlainText(enrichedItem.content);
    const readingTime = calculateReadingTime(plainText);
    enrichedItem.readingTime = readingTime;
    
    const tocHeadings = extractHeadingsFromContent(enrichedItem.content);
    
    if (sanityType === 'review' && enrichedItem.verdict) {
        tocHeadings.push({ id: 'verdict-summary', text: 'الخلاصة', level: 2 });
    }
    
    enrichedItem.toc = tocHeadings;

    const colorDictionary = dictionary?.autoColors || [];
    
    // UPDATE: Changed base URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.EternalGamesWeb.com';
    const jsonLdData = generateStructuredData(enrichedItem, sanityType, `${siteUrl}/${section}/${slug}`);

    const breadcrumbItems = [
        { name: 'الرئيسية', item: '/' },
        { name: sectionLabelMap[section] || section, item: `/${section}` },
        { name: enrichedItem.title, item: `/${section}/${slug}` }
    ];

    return (
        <>
            <JsonLd data={jsonLdData} />
            <BreadcrumbJsonLd items={breadcrumbItems} />
            {sanityType === 'news' && (
                <SpeakableJsonLd cssSelectors={['.page-title', '.article-body p:first-of-type']} />
            )}
            
            <ContentPageClient item={enrichedItem} type={section as any} colorDictionary={colorDictionary}>
                 <CommentSection 
                    slug={slug} 
                    contentType={section} 
                 />
            </ContentPageClient>
        </>
    );
}