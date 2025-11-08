// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';
import { CardProps } from '@/types';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const adaptToCardProps = (item: any): CardProps | null => {
    // THE DEFINITIVE FIX:
    // If an item from Sanity is missing a `legacyId` or the item itself is null,
    // it is considered corrupt data. We return `null` immediately. This prevents
    // items with `undefined` IDs from reaching the UI, which was the root cause of
    // both the disappearing cards (layoutId collision) and phantom bookmarks (state key collision).
    if (!item || item.legacyId === null || item.legacyId === undefined) {
        return null;
    }

    const imageAsset = item.mainImage?.asset || item.mainImageRef;
    let imageUrl = null;
    let blurDataURL: string = '';

    if (imageAsset) {
        imageUrl = urlFor(imageAsset).width(1600).height(900).fit('crop').auto('format').url();
        blurDataURL = urlFor(imageAsset).width(20).blur(10).auto('format').url();
    }

    if (!imageUrl) return null;

    let formattedDate = '';
    let publishedYear = null;

    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        formattedDate = `${day} ${arabicMonths[monthIndex]} ${year}`;
        publishedYear = year;
    }

    let primaryCreators = [];
    if (item._type === 'review' || item._type === 'article') {
        primaryCreators = item.authors || [];
    } else if (item._type === 'news') {
        primaryCreators = item.reporters || [];
    }
    
    if (primaryCreators.length === 0) {
        primaryCreators = item.authors || item.reporters || [];
    }

    return {
        type: item._type,
        id: item._id, 
        legacyId: item.legacyId,
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
        tags: (item.tags || []).map((t: any) => ({ title: t.title, slug: t.slug })).filter(Boolean),
        blurDataURL: blurDataURL,
        category: item.category?.title, // ADDED: Map the category title
        verdict: item.verdict || '',
        pros: item.pros || [],
        cons: item.cons || [],
        content: item.content || [],
        relatedReviewIds: item.relatedReviewIds || [],
        synopsis: item.synopsis,
    };
};