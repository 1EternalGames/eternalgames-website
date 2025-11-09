// app/tags/[tag]/page.tsx
import { client } from '@/lib/sanity.client';
import { allContentByTagListQuery } from '@/lib/sanity.queries'; // Use LEAN query
import { notFound } from 'next/navigation';
import HubPageClient from '@/components/HubPageClient';
import { translateTag } from '@/lib/translations';

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

    // MODIFIED: Using lean query for initial content load
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


