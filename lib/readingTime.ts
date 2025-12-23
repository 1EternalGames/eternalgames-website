// lib/readingTime.ts

export function calculateReadingTime(text: string): number {
    if (!text) return 0;
    
    const wordsPerMinute = 200;
    // Strip HTML tags if any (though usually we pass plain text)
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    const wordCount = cleanText.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    
    return readingTime;
}

/**
 * Extracts plain text from Portable Text blocks for analysis
 */
export function toPlainText(blocks: any[] = []): string {
    return blocks
      .map(block => {
        if (block._type !== 'block' || !block.children) {
          return ''
        }
        return block.children.map((child: any) => child.text).join('')
      })
      .join('\n\n')
}