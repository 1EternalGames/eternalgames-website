// app/tags/[tag]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByTagIdQuery } from '@/lib/sanity.queries'; // Use the new ID-based query
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import { translateTag } from '@/lib/translations';
import type { Metadata } from 'next';
import { urlFor } from '@/sanity/lib/image';

export const dynamicParams = true;

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const tagSlug = decodeURIComponent(tag);

  // Optimized: Fetch minimal data for metadata
  const tagData = await client.fetch(
    `*[_type == "tag" && slug.current == $slug][0]{title}`,
    { slug: tagSlug }
  );

  if (!tagData) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
  const translatedTitle = translateTag(tagData.title);
  const title = `وسم: ${translatedTitle}`;
  const description = `تصفح كل المحتوى الموسوم بـ "${translatedTitle}" على EternalGames واكتشف أحدث المقالات والمراجعات.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/tags/${tagSlug}`,
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

    // Step 1: Fetch the Tag ID and Title. This is a very fast index lookup.
    const tagDoc = await client.fetch(
        `*[_type == "tag" && slug.current == $slug][0]{_id, title}`, 
        { slug: tagSlug }
    );

    if (!tagDoc) {
        notFound();
    }

    // Step 2: Fetch content referencing this Tag ID.
    // This is much faster than filtering by slug string in a join.
    const allItems = await client.fetch(allContentByTagIdQuery, { tagId: tagDoc._id });

    if (!allItems || allItems.length === 0) {
        return (
            <div className="container page-container">
                <h1 className="page-title">وسم: &quot;{translateTag(tagDoc.title)}&quot;</h1>
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>لم يُنشر عملٌ بهذا الوسم بعد.</p>
            </div>
        );
    }
    
    return (
         <HubPageClient
            initialItems={allItems}
            hubTitle={translateTag(tagDoc.title)}
            hubType="وسم"
        />
    );
}