// app/studio/utils/portableTextToTiptap.ts

import { PortableTextBlock } from 'sanity';

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

    // --- THE DEFINITIVE FIX ---
    // Filter out any null/undefined items from the array that can result from
    // broken references in Sanity, preventing a server-side crash.
    const validBlocks = (blocks || []).filter(Boolean);

    validBlocks.forEach((block) => {
        // --- HANDLE LIST ITEMS ---
        if (block.listItem === 'bullet') {
            if (!currentList) {
                currentList = { type: 'bulletList', content: [] };
            }
            const listItemContent = processBlockChildren(block);
            currentList.content?.push({
                type: 'listItem',
                content: [{ type: 'paragraph', content: listItemContent }],
            });
            return; // Continue to next block
        }

        if (currentList) {
            content.push(currentList);
            currentList = null;
        }

        // --- HANDLE CUSTOM BLOCKS ---
        if (block._type === 'imageCompare') {
            const { image1, image2, size } = block as any;
            content.push({ type: 'imageCompare', attrs: { src1: image1?.asset?.url, assetId1: image1?.asset?._id, src2: image2?.asset?.url, assetId2: image2?.asset?._id, 'data-size': size || 'large' } });
            return;
        }
        if (block._type === 'twoImageGrid') {
            const { image1, image2 } = block as any;
            content.push({ type: 'twoImageGrid', attrs: { src1: image1?.asset?.url, assetId1: image1?.asset?._id, src2: image2?.asset?.url, assetId2: image2?.asset?._id } });
            return;
        }
        if (block._type === 'fourImageGrid') {
            const { image1, image2, image3, image4 } = block as any;
            content.push({ type: 'fourImageGrid', attrs: { src1: image1?.asset?.url, assetId1: image1?.asset?._id, src2: image2?.asset?.url, assetId2: image2?.asset?._id, src3: image3?.asset?.url, assetId3: image3?.asset?._id, src4: image4?.asset?.url, assetId4: image4?.asset?._id } });
            return;
        }
        if (block._type === 'image' && block.asset) {
            const asset = block.asset as any;
            const size = (block as any).size || 'large';
            if (asset?._id && asset?.url) {
                content.push({ type: 'image', attrs: { src: asset.url, assetId: asset._id, 'data-size': size } });
            }
            return;
        }
        
        // --- HANDLE TEXT BLOCKS ---
        if (block._type === 'block' && block.style) {
            const children = processBlockChildren(block);
            switch (block.style) {
                case 'h2':
                    content.push({ type: 'heading', attrs: { level: 2 }, content: children });
                    break;
                case 'blockquote':
                    content.push({ type: 'blockquote', content: [{ type: 'paragraph', content: children }] });
                    break;
                default:
                    content.push({ type: 'paragraph', content: children });
            }
        }
    });

    if (currentList) {
        content.push(currentList);
    }

    return { type: 'doc', content };
}

function processBlockChildren(block: PortableTextBlock): TiptapNode[] {
    return block.children?.map(span => {
        const marks = span.marks?.map(mark => {
            const markDef = block.markDefs?.find(def => def._key === mark);
            if (markDef?._type === 'link') {
                return { type: 'link', attrs: { href: markDef.href } };
            }
            if (mark === 'strong') return { type: 'bold' };
            if (mark === 'em') return { type: 'italic' };
            return null;
        }).filter(Boolean) as { type: string }[] || [];
        return { type: 'text', text: span.text, marks };
    }) || [];
}


