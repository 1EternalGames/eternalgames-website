// app/tags/[tag]/page.tsx
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import { translateTag } from '@/lib/translations';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';
import { getCachedTagPageData } from '@/lib/sanity.fetch';
import { client } from '@/lib/sanity.client'; 

export const dynamicParams = true;

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const tagSlug = decodeURIComponent(tag);

  // Request Memoization ensures this fetch is shared with the Page component
  const data = await getCachedTagPageData(tagSlug);

  if (!data) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const translatedTitle = translateTag(data.title); // 'title' is directly on 'data' now
  const title = `وسم: ${translatedTitle}`;
  const description = `تصفح كل المحتوى الموسوم بـ "${translatedTitle}" على EternalGames واكتشف أحدث المقالات والمراجعات.`;
  
  const latestItem = data.items && data.items.length > 0 ? data.items[0] : null;
  const ogImageUrl = latestItem?.mainImageRef
    ? urlFor(latestItem.mainImageRef).width(1200).height(630).fit('crop').format('jpg').url()
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
  };
}

export async function generateStaticParams() {
    try {
        const slugs = await client.fetch<string[]>(`*[_type == "tag" && defined(slug.current)][].slug.current`);
        return slugs.map((slug) => ({
            tag: slug,
        }));
    } catch (error) {
        return [];
    }
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    const tagSlug = decodeURIComponent(tag);

    // Returns result instantly from Metadata request cache
    const data = await getCachedTagPageData(tagSlug);

    if (!data) {
        notFound();
    }

    const { title: tagTitle, items: allItems } = data;

    if (!allItems || allItems.length === 0) {
        return (
            <div className="container page-container">
                <h1 className="page-title">وسم: &quot;{translateTag(tagTitle)}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم يُنشر عملٌ بهذا الوسم بعد.</p>
            </div>
        );
    }
    
    return (
         <HubPageClient
            initialItems={allItems}
            hubTitle={translateTag(tagTitle)}
            hubType="وسم"
        />
    );
}