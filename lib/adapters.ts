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
    
    if (!imageAsset && item.mainImage && item.mainImage._type === 'image') {
         imageAsset = item.mainImage.asset;
    }

    let imageUrl = null;
    let blurDataURL: string = '';
    
    const targetWidth = options.width || 1200;
    const targetHeight = Math.round(targetWidth * 0.5625);

    // FIXED: Strict check for asset existence
    if (imageAsset && (imageAsset._ref || imageAsset._id || imageAsset.url)) {
        try {
            imageUrl = urlFor(imageAsset).width(targetWidth).height(targetHeight).fit('crop').auto('format').url();
            blurDataURL = urlFor(imageAsset).width(20).blur(10).auto('format').url(); 
        } catch (e) {
            console.warn("Image URL generation failed", e);
            imageUrl = '/placeholder-game.jpg';
        }
    } else if (item.imageUrl) {
        imageUrl = item.imageUrl;
    } else {
        imageUrl = '/placeholder-game.jpg';
    }

    const verticalImageAsset = item.mainImageVertical?.asset || item.mainImageVerticalRef;
    let verticalImageUrl = null;
    if (verticalImageAsset && (verticalImageAsset._ref || verticalImageAsset._id || verticalImageAsset.url)) {
        try {
            verticalImageUrl = urlFor(verticalImageAsset).width(600).height(900).fit('crop').auto('format').url();
        } catch (e) {
             // Ignore vertical fail
        }
    }

    let formattedDate = '';
    let publishedYear = null;

    if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        formattedDate = `${day} ${arabicMonths[monthIndex]} ${year}`;
        publishedYear = year;
    } else if (item.releaseDate) {
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

    // IMPORTANT: Pass through the raw content array so the store can use it
    const contentBody = item.content || [];

    return {
        type: item._type,
        id: item._id, 
        legacyId: item.legacyId || 0,
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
        content: contentBody, // Pass body
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