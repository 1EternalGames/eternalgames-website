// lib/text-utils.ts

/**
 * Splits a long text into chunks of approximately `maxLength` characters.
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
 * Formats a duration in minutes according to Arabic grammatical rules.
 */
export function formatArabicDuration(minutes: number): string {
    const m = Math.round(minutes);
    if (m < 1) return 'أقل من دقيقة';
    if (m === 1) return 'دقيقة واحدة';
    if (m === 2) return 'دقيقتين';
    if (m >= 3 && m <= 10) return `${m} دقائق`;
    return `${m} دقيقة`;
}

/**
 * Generates a URL-friendly ID that PRESERVES Arabic characters.
 * Replaces spaces with dashes, removes special punctuation.
 */
export function generateId(text: string): string {
    if (!text) return '';
    return text
        .trim()
        .replace(/[؟?!\.,;:]/g, '') // Remove punctuation
        .replace(/\s+/g, '-')       // Replace spaces with dashes
        .toLowerCase();             // Lowercase (mostly for English parts)
}

/**
 * Extracts headings (h1, h2, h3) from Portable Text blocks.
 */
export function extractHeadingsFromContent(blocks: any[] = []): { id: string; text: string; level: number }[] {
    const headings: { id: string; text: string; level: number }[] = [];

    if (!Array.isArray(blocks)) return headings;

    blocks.forEach((block) => {
        if (block._type === 'block' && block.style && /^h[1-3]$/.test(block.style)) {
            const level = parseInt(block.style.substring(1));
            const text = block.children
                ? block.children.map((child: any) => child.text).join('')
                : '';
            
            if (text) {
                const id = generateId(text);
                headings.push({ id, text, level });
            }
        }
    });

    return headings;
}