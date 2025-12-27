// app/sitemap-html/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

export const metadata: Metadata = {
    title: 'خريطة الموقع',
    description: 'تصفح جميع أقسام ومحتويات موقع EternalGames.',
    robots: {
        index: true,
        follow: true,
    }
};

export const dynamic = 'force-static';

const sitemapDataQuery = groq`{
    "games": *[_type == "game" && !(_id in path("drafts.**"))] | order(title asc) { _id, title, "slug": slug.current },
    "reviews": *[_type == "review" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] { _id, title, "slug": slug.current },
    "articles": *[_type == "article" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] { _id, title, "slug": slug.current },
    "news": *[_type == "news" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...50] { _id, title, "slug": slug.current }
}`;

export default async function HtmlSitemapPage() {
    const data = await client.fetch(sitemapDataQuery);
    
    const cleanGames = (data.games || []).filter((i: any) => i.slug);
    const cleanReviews = (data.reviews || []).filter((i: any) => i.slug);
    const cleanArticles = (data.articles || []).filter((i: any) => i.slug);
    const cleanNews = (data.news || []).filter((i: any) => i.slug);

    const Section = ({ title, items, basePath }: { title: string, items: any[], basePath: string }) => (
        <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ 
                fontSize: '2.4rem', 
                borderBottom: '2px solid var(--border-color)', 
                paddingBottom: '1rem', 
                marginBottom: '2rem',
                color: 'var(--accent)'
            }}>
                {title}
            </h2>
            <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '1rem' 
            }}>
                {items.map((item: any) => (
                    <li key={item._id}>
                        {/* FIX: Disable prefetching for ALL these links */}
                        <Link 
                            href={`${basePath}/${item.slug}`} 
                            className="no-underline"
                            prefetch={false}
                            style={{ 
                                color: 'var(--text-primary)', 
                                transition: 'color 0.2s',
                                fontSize: '1.5rem' 
                            }}
                        >
                            {item.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="container page-container">
            <h1 className="page-title">خريطة الموقع</h1>
            
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.4rem', marginBottom: '2rem', color: 'var(--accent)' }}>أقسام رئيسية</h2>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <Link href="/" className="primary-button no-underline" prefetch={false}>الرئيسية</Link>
                    <Link href="/reviews" className="outline-button no-underline" prefetch={false}>المراجعات</Link>
                    <Link href="/news" className="outline-button no-underline" prefetch={false}>الأخبار</Link>
                    <Link href="/articles" className="outline-button no-underline" prefetch={false}>المقالات</Link>
                    <Link href="/releases" className="outline-button no-underline" prefetch={false}>الإصدارات</Link>
                    <Link href="/about" className="outline-button no-underline" prefetch={false}>من نحن</Link>
                </div>
            </div>

            <Section title="أحدث المراجعات" items={cleanReviews} basePath="/reviews" />
            <Section title="أحدث المقالات" items={cleanArticles} basePath="/articles" />
            <Section title="آخر الأخبار" items={cleanNews} basePath="/news" />
            
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '2.4rem', marginBottom: '2rem', color: 'var(--accent)' }}>مراكز الألعاب</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {cleanGames.map((game: any) => (
                        <Link 
                            key={game._id} 
                            href={`/games/${game.slug}`}
                            className="no-underline"
                            prefetch={false} // FIX: Disable prefetch
                            style={{ 
                                background: 'var(--bg-secondary)', 
                                padding: '0.5rem 1.5rem', 
                                borderRadius: '999px', 
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontSize: '1.3rem'
                            }}
                        >
                            {game.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}