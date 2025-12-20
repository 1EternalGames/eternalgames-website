// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';
import { CardProps } from '@/types';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const adaptToCardProps = (item: any, options: { width?: number } = {}): CardProps | null => {
    if (!item || item.legacyId === null || item.legacyId === undefined) {
        return null;
    }

    const imageAsset = item.mainImage?.asset || item.mainImageRef;
    let imageUrl = null;
    let blurDataURL: string = '';
    
    const targetWidth = options.width || 1200;
    const targetHeight = Math.round(targetWidth * 0.5625);

    if (imageAsset) {
        imageUrl = urlFor(imageAsset).width(targetWidth).height(targetHeight).fit('crop').auto('format').url();
        blurDataURL = urlFor(imageAsset).width(8).blur(10).auto('format').url();
    }

    if (!imageUrl) return null;

    // Process Vertical Image
    const verticalImageAsset = item.mainImageVertical?.asset || item.mainImageVerticalRef;
    let verticalImageUrl = null;
    if (verticalImageAsset) {
        // Vertical aspect ratio 2:3 or similar
        verticalImageUrl = urlFor(verticalImageAsset).width(600).height(900).fit('crop').auto('format').url();
    }

    let formattedDate = '';
    let publishedYear = null;

    // Handle Content Date (PublishedAt)
    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        formattedDate = `${day} ${arabicMonths[monthIndex]} ${year}`;
        publishedYear = year;
    } 
    // Handle Release Date (Specific formatting based on precision)
    else if (item.releaseDate) {
        const date = new Date(item.releaseDate);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        publishedYear = year;

        if (item.isTBA) {
            formattedDate = "غير معلن";
        } else if (item.datePrecision === 'year') {
            formattedDate = `${year}`;
        } else if (item.datePrecision === 'month') {
            formattedDate = `${arabicMonths[monthIndex]} ${year}`;
        } else {
            formattedDate = `${day} ${arabicMonths[monthIndex]} ${year}`;
        }
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

    const gameTitle = item.game?.title;
    const gameSlug = item.game?.slug;

    return {
        type: item._type,
        id: item._id, 
        legacyId: item.legacyId,
        slug: item.slug?.current ?? item.slug ?? '',
        game: gameTitle,
        gameSlug: gameSlug,
        title: item.title,
        authors: primaryCreators,
        designers: item.designers || [],
        date: formattedDate,
        year: publishedYear,
        imageUrl: imageUrl,
        verticalImageUrl: verticalImageUrl, // Added field
        mainImageRef: imageAsset,
        mainImageVerticalRef: verticalImageAsset, // Added field
        score: item.score,
        tags: (item.tags || []).map((t: any) => ({ title: t.title, slug: t.slug })).filter(Boolean),
        blurDataURL: blurDataURL,
        category: item.category?.title,
        newsType: item.newsType || 'official', 
        verdict: item.verdict || '',
        pros: item.pros || [],
        cons: item.cons || [],
        content: item.content || [],
        relatedReviewIds: item.relatedReviewIds || [],
        synopsis: item.synopsis,

        // NEW: Release Specific Fields (Optional for other types)
        onGamePass: item.onGamePass || false,
        onPSPlus: item.onPSPlus || false,
        trailer: item.trailer || '',
        isPinned: item.isPinned || false,
        datePrecision: item.datePrecision || 'day', 
        isTBA: item.isTBA || false,
    };
};


