// app/page.tsx
import React from 'react';
import HomeJsonLd from '@/components/seo/HomeJsonLd'; 
import CarouselJsonLd from '@/components/seo/CarouselJsonLd'; 
import { getUniversalBaseData } from '@/app/actions/layoutActions';
import { urlFor } from '@/sanity/lib/image';
import HomepageHydrator from '@/components/HomepageHydrator';

export const dynamic = 'force-static';

export default async function HomePage() {
    // Only the homepage fetches the heavy data at build time.
    const data = await getUniversalBaseData();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';
    
    const carouselItems = data.reviews.slice(0, 5).map((review: any, index: number) => ({
        url: `${siteUrl}/reviews/${review.slug}`,
        position: index + 1,
        name: review.title,
        image: review.mainImage ? urlFor(review.mainImage).width(1200).url() : undefined
    }));

    return (
        <>
            <HomeJsonLd />
            {carouselItems.length > 0 && <CarouselJsonLd data={carouselItems} />}
            
            {/* Hydrate the store so UniversalBaseLoader (in layout) can render */}
            <HomepageHydrator data={data} />
        </>
    );
}