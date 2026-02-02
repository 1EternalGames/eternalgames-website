// lib/adapters.ts
import { urlFor } from '@/sanity/lib/image';
import { CardProps } from '@/types';

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const adaptToCardProps = (item: any, options: { width?: number } = {}): CardProps | null => {
    if (!item || (!item._id && !item.id)) {
        return null;
    }
    
    // THE FIX: Ensure slug is a valid string or null, never an empty string.
    const slug = item.slug?.current ?? item.slug ?? null;
    if (!slug) {
        // If there's no slug, we can't link to it, so discard the item.
        return null;
    }

    // Defensive Image Extraction
    let imageAsset = item.mainImage?.asset || item.mainImageRef;
    
    if (!imageAsset && item.mainImage && item.mainImage._type === 'image') {
         imageAsset = item.mainImage.asset;
    }

    let imageUrl = null;
    // FIX: Initialize with the GROQ-fetched LQIP (Base64) if available
    let blurDataURL: string = item.blurDataURL || item.mainImage?.blurDataURL || '';
    
    const targetWidth = options.width || 1200;
    const targetHeight = Math.round(targetWidth * 0.5625);

    // FIXED: Strict check for asset existence
    if (imageAsset && (imageAsset._ref || imageAsset._id || imageAsset.url)) {
        try {
            imageUrl = urlFor(imageAsset).width(targetWidth).height(targetHeight).fit('crop').auto('format').url();
            
            // FIX: Only generate a URL-based blur fallback if we DON'T have a base64 string.
            // Note: Next.js <Image> really prefers Base64 for 'blurDataURL'. 
            // Passing a CDN URL here usually won't work for the 'blur' placeholder effect unless configured specifically.
            // So we primarily rely on the incoming `blurDataURL`.
            if (!blurDataURL) {
                 // Fallback: If no LQIP, we can't easily sync-generate one. 
                 // We leave it empty to avoid broken image icons.
                 blurDataURL = '';
            }
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

    const gameTitle = item.game?.title || item.game; // Handle both object and string
    const gameSlug = item.game?.slug;

    // IMPORTANT: Pass through the raw content array so the store can use it
    const contentBody = item.content || [];

    return {
        type: item._type,
        id: item._id, 
        legacyId: item.legacyId || 0,
        slug: slug,
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
        blurDataURL: blurDataURL, // Now correctly using the Base64 string
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