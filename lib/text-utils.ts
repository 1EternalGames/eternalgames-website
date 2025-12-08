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

        // Search for a good break point within the allowed range
        let breakIndex = remaining.lastIndexOf('.', maxLength);
        
        // If no period found, try newline
        if (breakIndex === -1) {
            breakIndex = remaining.lastIndexOf('\n', maxLength);
        }

        // If no newline, try space
        if (breakIndex === -1) {
            breakIndex = remaining.lastIndexOf(' ', maxLength);
        }

        // If no space found (giant word?), force break
        if (breakIndex === -1) {
            breakIndex = maxLength;
        }

        // Include the delimiter in the current chunk if it's a period
        const includeDelimiter = remaining[breakIndex] === '.';
        const cutIndex = includeDelimiter ? breakIndex + 1 : breakIndex;

        chunks.push(remaining.slice(0, cutIndex).trim());
        remaining = remaining.slice(cutIndex).trim();
    }

    return chunks;
}