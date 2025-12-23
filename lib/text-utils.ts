// lib/text-utils.ts

/**
 * Splits a long text into chunks of approximately `maxLength` characters,
 * trying to break at sentence boundaries (. or \n) or word boundaries.
 */
export function smartSplitText(text: string, maxLength: number = 400): string[] {
    if (!text) return [''];
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining.trim());
            break;
        }

        let breakIndex = remaining.lastIndexOf('.', maxLength);
        if (breakIndex === -1) breakIndex = remaining.lastIndexOf('\n', maxLength);
        if (breakIndex === -1) breakIndex = remaining.lastIndexOf(' ', maxLength);
        if (breakIndex === -1) breakIndex = maxLength;

        const includeDelimiter = remaining[breakIndex] === '.';
        const cutIndex = includeDelimiter ? breakIndex + 1 : breakIndex;

        chunks.push(remaining.slice(0, cutIndex).trim());
        remaining = remaining.slice(cutIndex).trim();
    }

    return chunks;
}

/**
 * Formats a duration in minutes according to Arabic grammatical rules for numbers.
 */
export function formatArabicDuration(minutes: number): string {
    const m = Math.round(minutes);
    
    if (m < 1) return 'أقل من دقيقة';
    if (m === 1) return 'دقيقة واحدة';
    if (m === 2) return 'دقيقتين';
    if (m >= 3 && m <= 10) return `${m} دقائق`;
    // 11+ is singular accusative (e.g., 15 دقيقة)
    return `${m} دقيقة`;
}