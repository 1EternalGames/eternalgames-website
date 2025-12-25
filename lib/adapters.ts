// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';
import { CardProps } from '@/types';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const adaptToCardProps = (item: any, options: { width?: number } = {}): CardProps | null => {
    if (!item || (!item._id && !item.id)) {
        return null;
    }

    // Defensive Image Extraction
    let imageAsset = item.mainImage?.asset || item.mainImageRef;
    
    // Handle case where image might be directly the asset object (from some queries)
    if (!imageAsset && item.mainImage && item.mainImage._type === 'image') {
         imageAsset = item.mainImage.asset;
    }

    let imageUrl = null;
    let blurDataURL: string = '';
    
    const targetWidth = options.width || 1200;
    const targetHeight = Math.round(targetWidth * 0.5625);

    if (imageAsset) {
        // Handle both expanded asset objects (with url) and reference objects (with _ref)
        imageUrl = urlFor(imageAsset).width(targetWidth).height(targetHeight).fit('crop').auto('format').url();
        blurDataURL = urlFor(imageAsset).width(20).blur(10).auto('format').url(); // Low res blur
    } else if (item.imageUrl) {
        // Fallback if imageUrl string is pre-calculated
        imageUrl = item.imageUrl;
    }

    if (!imageUrl) {
        // Optional: Return a placeholder instead of null if you want cards to show without images
        // return null; 
        imageUrl = '/placeholder-game.jpg'; // Fallback
    }

    // Process Vertical Image
    const verticalImageAsset = item.mainImageVertical?.asset || item.mainImageVerticalRef;
    let verticalImageUrl = null;
    if (verticalImageAsset) {
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
    // Handle Release Date
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
        legacyId: item.legacyId || 0, // Ensure number
        slug: item.slug?.current ?? item.slug ?? '',
        game: gameTitle,
        gameSlug: gameSlug,
        title: item.title,
        authors: primaryCreators,
        designers: item.designers || [],
        date: formattedDate,
        year: publishedYear,
        imageUrl: imageUrl,
        verticalImageUrl: verticalImageUrl, 
        mainImageRef: imageAsset,
        mainImageVerticalRef: verticalImageAsset, 
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
        onGamePass: item.onGamePass || false,
        onPSPlus: item.onPSPlus || false,
        trailer: item.trailer || '',
        isPinned: item.isPinned || false,
        datePrecision: item.datePrecision || 'day', 
        isTBA: item.isTBA || false,
    };
};