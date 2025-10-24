// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const adaptToCardProps = (item: any) => {
    if (!item) return null;

    let imageUrl = null;
    let blurDataURL: string = '';

    if (item.mainImage?.url) { // Handles data from "heavy" queries
        imageUrl = item.mainImage.url;
        blurDataURL = item.mainImage.blurDataURL || '';
    } else if (item.mainImageRef) { // Handles data from our "lean" queries
        imageUrl = urlFor(item.mainImageRef).width(1920).auto('format').url();
        blurDataURL = urlFor(item.mainImageRef).width(20).blur(10).quality(30).auto('format').url();
    }

    if (!imageUrl) return null;

    let formattedDate = '';
    let publishedYear = null;

    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;
        publishedYear = year;
    }

    // Determine the primary authors/reporters based on type
    const primaryCreators = item.authors || item.reporters || [];

    return {
        type: item._type,
        id: item.legacyId ?? item._id,
        slug: item.slug?.current ?? item.slug ?? '',
        game: item.game?.title,
        title: item.title,
        authors: primaryCreators, // Pass the full array
        designers: item.designers || [], // Pass the full array
        date: formattedDate,
        year: publishedYear,
        imageUrl: imageUrl,
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