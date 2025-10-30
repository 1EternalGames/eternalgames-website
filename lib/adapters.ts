// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';
import { CardProps } from '@/types';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const adaptToCardProps = (item: any): CardProps | null => {
    if (!item) return null;

    const imageAsset = item.mainImage?.asset || item.mainImageRef;
    let imageUrl = null;
    let blurDataURL: string = '';

    if (imageAsset) {
        // THE DEFINITIVE FIX: Enforce a 16:9 aspect ratio crop and remove quality params.
        imageUrl = urlFor(imageAsset).width(1600).height(900).fit('crop').auto('format').url();
        blurDataURL = urlFor(imageAsset).width(20).blur(10).auto('format').url();
    }

    if (!imageUrl) return null;

    let formattedDate = '';
    let publishedYear = null;

    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        const day = date.toLocaleDateString('en-US', { day: 'numeric' });
        const monthIndex = date.getMonth();
        const year = date.toLocaleDateString('en-US', { year: 'numeric' });
        formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;
        publishedYear = parseInt(year);
    }

    const primaryCreators = item.authors || item.reporters || [];

    return {
        type: item._type,
        id: item.legacyId ?? item._id,
        slug: item.slug?.current ?? item.slug ?? '',
        game: item.game?.title,
        title: item.title,
        authors: primaryCreators,
        designers: item.designers || [],
        date: formattedDate,
        year: publishedYear,
        imageUrl: imageUrl,
        mainImageRef: imageAsset,
        score: item.score,
        tags: (item.tags || []).map((t: any) => t.title).filter(Boolean),
        blurDataURL: blurDataURL,
        verdict: item.verdict || '',
        pros: item.pros || [],
        cons: item.cons || [],
        content: item.content || [],
        relatedReviewIds: item.relatedReviewIds || [],
        category: item.category,
    };
};