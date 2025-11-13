// app/studio/utils/portableTextToTiptap.ts

import { PortableTextBlock } from '@portabletext/types';
import type { SanityImageObject as SanityImage } from '@sanity/image-url/lib/types/types';

// Type definitions for Tiptap's JSON structure
interface TiptapNode {
    type: string;
    attrs?: Record<string, any>;
    content?: TiptapNode[];
    text?: string;
    marks?: { type: string; attrs?: Record<string, any> }[];
}

/**
 * Converts a Sanity Portable Text array to Tiptap's JSON format.
 * @param blocks The array of Portable Text blocks from Sanity.
 * @returns A Tiptap-compatible JSON object representing the document content.
 */
export function portableTextToTiptap(blocks: PortableTextBlock[] = []): Record<string, any> {
    const content: TiptapNode[] = [];
    let currentList: TiptapNode | null = null;

    // Filter out any null/undefined items from the array
    const validBlocks = (blocks || []).filter(Boolean);

    validBlocks.forEach((block) => {
        // --- HANDLE LIST ITEMS ---
        if (block._type === 'block' && block.listItem === 'bullet') {
            if (!currentList) {
                currentList = { type: 'bulletList', content: [] };
            }
            const listItemContent = processBlockChildren(block);
            currentList.content?.push({
                type: 'listItem',
                content: [{ type: 'paragraph', content: listItemContent }],
            });
            return;
        }

        if (currentList) {
            content.push(currentList);
            currentList = null;
        }

        // --- HANDLE CUSTOM BLOCKS ---
        if (block._type === 'imageCompare') {
            const { image1, image2, size } = block as any;
            content.push({ 
                type: 'imageCompare', 
                attrs: { 
                    src1: image1?.asset?.url, 
                    assetId1: image1?.asset?._id, 
                    src2: image2?.asset?.url, 
                    assetId2: image2?.asset?._id, 
                    'data-size': size || 'large' 
                } 
            });
            return;
        }
        if (block._type === 'twoImageGrid') {
            const { image1, image2 } = block as any;
            content.push({ 
                type: 'twoImageGrid', 
                attrs: { 
                    src1: image1?.asset?.url, 
                    assetId1: image1?.asset?._id, 
                    src2: image2?.asset?.url, 
                    assetId2: image2?.asset?._id 
                } 
            });
            return;
        }
        if (block._type === 'fourImageGrid') {
            const { image1, image2, image3, image4 } = block as any;
            content.push({ 
                type: 'fourImageGrid', 
                attrs: { 
                    src1: image1?.asset?.url, 
                    assetId1: image1?.asset?._id, 
                    src2: image2?.asset?.url, 
                    assetId2: image2?.asset?._id, 
                    src3: image3?.asset?.url, 
                    assetId3: image3?.asset?._id, 
                    src4: image4?.asset?.url, 
                    assetId4: image4?.asset?._id 
                } 
            });
            return;
        }
        if (block._type === 'image') {
            const imageBlock = block as unknown as SanityImage & { asset: { _id: string, url: string } };
            if (imageBlock.asset?._id && imageBlock.asset?.url) {
                content.push({ 
                    type: 'image', 
                    attrs: { 
                        src: imageBlock.asset.url, 
                        assetId: imageBlock.asset._id 
                    } 
                });
            }
            return;
        }
        
        // --- HANDLE TEXT BLOCKS ---
        if (block._type === 'block' && block.style) {
            const children = processBlockChildren(block);
            
            // THE DEFINITIVE FIX:
            // A Portable Text block with an empty span (`children.length === 1` and `children[0].text === ''`)
            // must be converted to a Tiptap paragraph with NO `content` property.
            // This correctly represents a blank line in the Tiptap editor.
            const isEffectivelyEmpty = children.length === 1 && children[0].text === '';
            const nodeContent = isEffectivelyEmpty ? {} : { content: children };

            switch (block.style) {
                case 'h1':
                    content.push({ type: 'heading', attrs: { level: 1 }, ...nodeContent });
                    break;
                case 'h2':
                    content.push({ type: 'heading', attrs: { level: 2 }, ...nodeContent });
                    break;
                case 'h3':
                    content.push({ type: 'heading', attrs: { level: 3 }, ...nodeContent });
                    break;
                case 'blockquote':
                    content.push({ type: 'blockquote', content: [{ type: 'paragraph', ...nodeContent }] });
                    break;
                default:
                    content.push({ type: 'paragraph', ...nodeContent });
            }
        }
    });

    if (currentList) {
        content.push(currentList);
    }

    return { type: 'doc', content };
}

function processBlockChildren(block: PortableTextBlock): TiptapNode[] {
    // Ensure block.children is an array before mapping
    const children = Array.isArray(block.children) ? block.children : [];
    
    // CRITICAL FIX: Filter out undefined/null children and handle empty text
    const processedChildren = children
        .filter(span => span && span._type === 'span') // Only process valid spans
        .map(span => {
            // Ensure span.marks is an array before mapping
            const marks = (Array.isArray(span.marks) ? span.marks : []).map(mark => {
                const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
                const markDef = markDefs.find(def => def._key === mark);
                if (markDef?._type === 'link') {
                    return { type: 'link', attrs: { href: (markDef as any).href } };
                }
                // Handle 'color' annotations from Sanity
                if (markDef?._type === 'color') {
                    return { type: 'textStyle', attrs: { color: (markDef as any).hex } };
                }
                if (mark === 'strong') return { type: 'bold' };
                if (mark === 'em') return { type: 'italic' };
                return null;
            }).filter(Boolean) as { type: string, attrs?: any }[];
            
            // CRITICAL: Handle undefined or null text
            return { 
                type: 'text', 
                text: span.text ?? '', // Use nullish coalescing to default to empty string
                marks 
            };
        });
    
    return processedChildren;
}