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

    // === News-Specific Tags (Now also used for Category) ===
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

// THE FIX: Added role translations
const ROLE_TRANSLATIONS: Record<string, string> = {
    "DIRECTOR": "المدير",
    "ADMIN": "المسؤول",
    "REVIEWER": "المُراجع",
    "AUTHOR": "الكاتب",
    "REPORTER": "المراسل",
    "DESIGNER": "المصمم",
    "USER": "عضو"
};

export const translateTag = (tagTitle: string): string => {
    return TAG_TRANSLATIONS[tagTitle] || tagTitle;
};

export const translateRole = (roleName: string): string => {
    return ROLE_TRANSLATIONS[roleName] || roleName;
};