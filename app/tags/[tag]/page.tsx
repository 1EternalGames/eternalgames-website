// app/tags/[tag]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByTagListQuery } from '@/lib/sanity.queries'; // Use LEAN query
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import { translateTag } from '@/lib/translations';

export const dynamicParams = true; // <--- ADDED THIS LINE

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