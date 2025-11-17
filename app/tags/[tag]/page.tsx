// app/tags/[tag]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByTagListQuery } from '@/lib/sanity.queries';
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import { translateTag } from '@/lib/translations';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';

export const dynamicParams = true;

type Props = {
  params: { tag: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = params;
  const tagSlug = decodeURIComponent(tag);

  const data = await client.fetch(
    `{
      "tag": *[_type == "tag" && slug.current == $slug][0]{title},
      "latestItem": *[_type in ["review", "article", "news"] && ($slug in tags[]->slug.current || category->slug.current == $slug)] | order(publishedAt desc)[0]{mainImage}
    }`,
    { slug: tagSlug }
  );

  if (!data.tag) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const translatedTitle = translateTag(data.tag.title);
  const title = `وسم: ${translatedTitle}`;
  const description = `تصفح كل المحتوى الموسوم بـ "${translatedTitle}" على EternalGames واكتشف أحدث المقالات والمراجعات.`;
  const ogImageUrl = data.latestItem?.mainImage
    ? urlFor(data.latestItem.mainImage).width(1200).height(630).fit('crop').format('jpg').url()
    : `${siteUrl}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/tags/${tagSlug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}


export async function generateStaticParams() {
    try {
        const slugs = await client.fetch<string[]>(`*[_type == "tag" && defined(slug.current)][].slug.current`);
        return slugs.map((slug) => ({
            tag: slug,
        }));
    } catch (error) {
        console.error(`[BUILD ERROR] CRITICAL: Failed to fetch slugs for tag hub pages. Build cannot continue.`, error);
        throw error;
    }
}

export default async function TagPage({ params }: { params: { tag: string } }) {
    const { tag } = await params;
    const tagSlug = decodeURIComponent(tag);

    const tagMeta = await client.fetch(
        `*[_type == "tag" && slug.current == $slug][0]{title}`,
        { slug: tagSlug }
    );

    if (!tagMeta) {
        notFound();
    }

    const allItems = await client.fetch(allContentByTagListQuery, { slug: tagSlug });

    if (!allItems || allItems.length === 0) {
        return (
            <div className="container page-container">
                <h1 className="page-title">وسم: &quot;{translateTag(tagMeta.title)}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم يُنشر عملٌ بهذا الوسم بعد.</p>
            </div>
        );
    }
    
    return (
         <HubPageClient
            initialItems={allItems}
            hubTitle={translateTag(tagMeta.title)}
            hubType="وسم"
        />
    );
}