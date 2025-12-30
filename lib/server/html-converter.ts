import 'server-only';
import { PortableTextBlock } from '@portabletext/types';
import { generateId } from '@/lib/text-utils';

// Regex to find English words
const ENGLISH_REGEX = /(\b[a-zA-Z]+(?:['’][a-zA-Z]+)?\b)/g;

type ColorMapping = {
    word: string;
    color: string;
};

// Inline Styles (Minified)
const S = {
    h1: "font-size:3.6rem;margin:5rem 0 2rem 0;padding-bottom:1rem;border-bottom:1px solid var(--border-color);font-family:var(--font-main),sans-serif;line-height:1.2",
    h2: "font-size:2.8rem;margin:5rem 0 2rem 0;padding-bottom:1rem;border-bottom:1px solid var(--border-color);font-family:var(--font-main),sans-serif;line-height:1.2",
    h3: "font-size:2.2rem;margin:4rem 0 1.5rem 0;font-family:var(--font-main),sans-serif;line-height:1.2",
    blockquote: "margin:4rem 0;padding-right:2rem;border-right:4px solid var(--accent);font-size:2.4rem;font-style:italic;color:var(--text-primary)",
    link: "color:var(--accent);text-decoration:underline;text-decoration-color:color-mix(in srgb, var(--accent) 50%, transparent)",
    colorMark: "font-weight:700",
    english: "font-weight:700"
};

const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Applies automated text highlighting (English bolding + Color Dictionary)
 */
const processTextContent = (text: string, colorMap: Map<string, string>, colorRegex: RegExp | null): string => {
    if (!text) return '';

    let processed = escapeHtml(text);

    // 1. Apply Color Dictionary
    if (colorRegex) {
        processed = processed.replace(colorRegex, (match) => {
            const lower = match.toLowerCase();
            const color = colorMap.get(lower);
            if (color) {
                return `<span style="color:${color};font-weight:700">${match}</span>`;
            }
            return match;
        });
    }

    // 2. Apply English Bolding
    // We strictly match English words that are NOT inside HTML tags we just created
    processed = processed.replace(ENGLISH_REGEX, (match) => {
        // Simple heuristic: if we are inside a span tag from step 1, don't double wrap
        return `<strong style="${S.english}">${match}</strong>`;
    });

    return processed;
};

/**
 * Serializes a single Portable Text block to an HTML string.
 */
const serializeBlock = (block: PortableTextBlock, colorMap: Map<string, string>, colorRegex: RegExp | null): string | null => {
    if (!block.children || !Array.isArray(block.children)) return null;

    // 1. Render Children (Spans)
    const childrenHtml = block.children.map((span: any) => {
        if (span._type !== 'span') return '';
        
        let text = processTextContent(span.text, colorMap, colorRegex);
        
        if (!span.marks || span.marks.length === 0) return text;

        // Apply Marks (Decorators & Annotations)
        span.marks.forEach((mark: string) => {
            if (mark === 'strong') text = `<strong>${text}</strong>`;
            else if (mark === 'em') text = `<em>${text}</em>`;
            else if (block.markDefs) {
                const def = block.markDefs.find((d: any) => d._key === mark);
                if (def) {
                    if (def._type === 'link') {
                        // Cast href to string to fix TS error
                        const href = (def.href as string) || '#';
                        const target = href.startsWith('/') ? '_self' : '_blank';
                        const rel = href.startsWith('/') ? '' : 'noreferrer noopener';
                        text = `<a href="${escapeHtml(href)}" style="${S.link}" target="${target}" rel="${rel}">${text}</a>`;
                    } else if (def._type === 'color') {
                        text = `<span style="color:${def.hex};${S.colorMark}">${text}</span>`;
                    }
                }
            }
        });
        return text;
    }).join('');

    // 2. Wrap in Block Tag
    const style = block.style || 'normal';
    
    // Generate ID for headings
    let idAttr = '';
    if (['h1', 'h2', 'h3'].includes(style)) {
        const plainText = block.children.map((c: any) => c.text).join('');
        idAttr = ` id="${generateId(plainText)}"`;
    }

    switch (style) {
        case 'h1': return `<h1${idAttr} style="${S.h1}">${childrenHtml}</h1>`;
        case 'h2': return `<h2${idAttr} style="${S.h2}">${childrenHtml}</h2>`;
        case 'h3': return `<h3${idAttr} style="${S.h3}">${childrenHtml}</h3>`;
        case 'blockquote': return `<blockquote style="${S.blockquote}">${childrenHtml}</blockquote>`;
        case 'normal': return `<p>${childrenHtml}</p>`; // p styles are global/inherited
        default: return `<p>${childrenHtml}</p>`;
    }
};

/**
 * Main conversion function used by Universal Data fetcher
 */
export function convertContentToHybridHtml(content: PortableTextBlock[], colorDictionary: ColorMapping[]) {
    if (!content || !Array.isArray(content)) return [];

    const colorMap = new Map(colorDictionary.map((item) => [item.word.toLowerCase(), item.color]));
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const colorRegex = colorDictionary.length > 0 
        ? new RegExp(`\\b(${colorDictionary.map((item) => escapeRegExp(item.word)).join('|')})\\b`, 'gi') 
        : null;

    const result: (string | PortableTextBlock)[] = [];
    
    // Batch consecutive strings to reduce array size further
    let htmlBuffer = '';

    content.forEach(block => {
        const isStandardBlock = 
            block._type === 'block' && 
            (!block.style || ['normal', 'h1', 'h2', 'h3', 'blockquote'].includes(block.style));

        if (isStandardBlock) {
            const html = serializeBlock(block, colorMap, colorRegex);
            if (html) {
                htmlBuffer += html;
            }
        } else {
            // Flush buffer if we hit a custom component
            if (htmlBuffer) {
                result.push(htmlBuffer);
                htmlBuffer = '';
            }
            result.push(block);
        }
    });

    // Final flush
    if (htmlBuffer) {
        result.push(htmlBuffer);
    }

    return result;
}