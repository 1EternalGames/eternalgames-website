// app/page.tsx
import React from 'react';
import HomeJsonLd from '@/components/seo/HomeJsonLd'; 
import CarouselJsonLd from '@/components/seo/CarouselJsonLd'; 
import { getUniversalBaseData } from '@/app/actions/layoutActions';
import { urlFor } from '@/sanity/lib/image';

export const dynamic = 'force-static';

export default async function HomePage() {
    // We fetch here purely for Metadata/JSON-LD purposes if needed, 
    // but visual content is now in Layout -> UniversalBase.
    
    // To generate Carousel JSON-LD, we need the reviews.
    // Since getUniversalBaseData is cached, calling it again is cheap.
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
            {/* 
              This component is now visually empty because UniversalBase in layout handles the UI.
              This acts as the "Home" route handler.
            */}
        </>
    );
}