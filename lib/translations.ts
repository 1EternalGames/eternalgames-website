// lib/translations.ts

const TAG_TRANSLATIONS: Record<string, string> = {
    // === Game Tags (For Reviews & Articles) ===
    "Action": "أكشن",
    "Adventure": "مغامرات",
    "RPG": "تقمص الأدوار",
    "JRPG": "تقمص أدوار ياباني",
    "Strategy": "استراتيجية",
    "Simulation": "محاكاة",
    "Sports": "رياضة",
    "Racing": "سباقات",
    "Puzzle": "ألغاز",
    "Fighting": "قتال",
    "Horror": "رُعب",
    "Survival": "نجاة",
    "Platformer": "منصات",
    "FPS": "منظور الشخص الأول",
    "TPS": "منظور الشخص الثالث",
    "Sci-Fi": "خيال علمي",
    "Fantasy": "فانتازيا",
    "Historical": "تاريخي",
    "Post-Apocalyptic": "ما بعد الفناء",
    "Cyberpunk": "سايبربنك",
    "Mystery": "غموض",
    "Atmospheric": "أجواء غامرة",
    "Open World": "عالم مفتوح",
    "Single-Player": "طور فردي",
    "Multiplayer": "طور جماعي",
    "Co-op": "طور تعاوني",
    "Competitive": "طور تنافسي",
    "Story-Driven": "عمق قصصي",
    "Pixel Art": "فن البكسل",
    "Anime": "أنمي",
    "Classic": "كلاسيكي",
    "Indie": "ألعاب مستقلة",

    // === News-Specific Tags ===
    "Acquisition": "استحواذ",
    "Sales": "أرقام المبيعات",
    "Game Announcement": "الكشف عن لعبة",
    "Industry News": "نبض الصناعة",
    "Financials": "شؤون مالية",
    "Technology": "تقنية",
    "Esports": "المنافسات الإلكترونية",
    "Game Update": "تحديث للعبة",
    "Layoffs": "تسريح موظفين",
    "Game Size": "حجم اللعبة",
    "Release Date": "موعد الإصدار",
    "Age Ratings": "تقييمات عمرية",

    // === Article-Specific Tags ===
    "Opinion": "رأي",
    "Guide": "إعانة",
    "Everything You Need to Know": "الدليل الشامل",
    "Analysis": "تحليل",
    "Biography": "سيرة",
    "Story": "قصة",
};

/**
 * Translates an English tag title to Arabic.
 * If no translation is found, it returns the original English title.
 * @param tagTitle The English tag title from Sanity.
 * @returns The translated Arabic string or the original string.
 */
export const translateTag = (tagTitle: string): string => {
    return TAG_TRANSLATIONS[tagTitle] || tagTitle;
};





