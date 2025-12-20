// app/studio/utils/portableTextToTiptap.ts

import {PortableTextBlock} from '@portabletext/types'
import type {SanityImageObject as SanityImage} from '@sanity/image-url/lib/types/types'
import { projectId, dataset } from '@/lib/sanity.env'

// Type definitions for Tiptap's JSON structure
interface TiptapNode {
  type: string
  attrs?: Record<string, any>
  content?: TiptapNode[]
  text?: string
  marks?: {type: string; attrs?: Record<string, any>}[]
}

// Helper to reconstruct Sanity CDN URL from an Asset ID/Ref
// Format: image-AssetID-WidthxHeight-Format
const buildSanityUrl = (ref?: string): string | null => {
  if (!ref) return null;
  const parts = ref.split('-');
  // We expect 4 parts: ["image", "id", "dimensions", "format"]
  if (parts.length !== 4) return null;
  const id = parts[1];
  const dimensions = parts[2];
  const format = parts[3];
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

const resolveImageAttrs = (sanityImageObj: any) => {
  const asset = sanityImageObj?.asset;
  const assetId = asset?._id || asset?._ref;
  let url = asset?.url;

  if (!url && assetId) {
    url = buildSanityUrl(assetId);
  }

  return { assetId, url };
}

/**
 * Converts a Sanity Portable Text array to Tiptap's JSON format.
 * @param blocks The array of Portable Text blocks from Sanity.
 * @returns A Tiptap-compatible JSON object representing the document content.
 */
export function portableTextToTiptap(blocks: PortableTextBlock[] = []): Record<string, any> {
  const content: TiptapNode[] = []
  let currentList: TiptapNode | null = null

  const validBlocks = (blocks || []).filter(Boolean)

  validBlocks.forEach((block: any) => {
    // --- HANDLE LIST ITEMS ---
    if (block._type === 'block' && block.listItem === 'bullet') {
      if (!currentList) {
        currentList = {type: 'bulletList', content: []}
      }
      const listItemContent = processBlockChildren(block)
      currentList.content?.push({
        type: 'listItem',
        content: [{type: 'paragraph', content: listItemContent}],
      })
      return
    }

    if (currentList) {
      content.push(currentList)
      currentList = null
    }

    // --- HANDLE CUSTOM BLOCKS ---
    if (block._type === 'youtube') {
      content.push({
        type: 'youtube',
        attrs: {
          src: block.url,
        },
      })
      return
    }
    if (block._type === 'gameDetails') {
      content.push({
        type: 'gameDetails',
        attrs: {
          details: block.details || [],
        },
      })
      return
    }
    if (block._type === 'table') {
      const tableContent: TiptapNode[] = []
      ;(block.rows || []).forEach((row: any) => {
        const rowContent: TiptapNode[] = []
        ;(row.cells || []).forEach((cell: any) => {
          const cellType = cell.isHeader ? 'tableHeader' : 'tableCell'
          const cellContent = portableTextToTiptap(cell.content || []).content
          rowContent.push({type: cellType, content: cellContent})
        })
        tableContent.push({type: 'tableRow', content: rowContent})
      })
      content.push({type: 'table', content: tableContent})
      return
    }
    
    if (block._type === 'imageCompare') {
      const {image1, image2, size} = block as any
      const img1 = resolveImageAttrs(image1);
      const img2 = resolveImageAttrs(image2);
      
      content.push({
        type: 'imageCompare',
        attrs: {
          src1: img1.url,
          assetId1: img1.assetId,
          src2: img2.url,
          assetId2: img2.assetId,
          'data-size': size || 'large',
        },
      })
      return
    }
    
    if (block._type === 'twoImageGrid') {
      const {image1, image2} = block as any
      const img1 = resolveImageAttrs(image1);
      const img2 = resolveImageAttrs(image2);

      content.push({
        type: 'twoImageGrid',
        attrs: {
          src1: img1.url,
          assetId1: img1.assetId,
          src2: img2.url,
          assetId2: img2.assetId,
        },
      })
      return
    }
    
    if (block._type === 'fourImageGrid') {
      const {image1, image2, image3, image4} = block as any
      const img1 = resolveImageAttrs(image1);
      const img2 = resolveImageAttrs(image2);
      const img3 = resolveImageAttrs(image3);
      const img4 = resolveImageAttrs(image4);

      content.push({
        type: 'fourImageGrid',
        attrs: {
          src1: img1.url,
          assetId1: img1.assetId,
          src2: img2.url,
          assetId2: img2.assetId,
          src3: img3.url,
          assetId3: img3.assetId,
          src4: img4.url,
          assetId4: img4.assetId,
        },
      })
      return
    }
    
    if (block._type === 'image') {
      const img = resolveImageAttrs(block);
      if (img.assetId && img.url) {
        content.push({
          type: 'image',
          attrs: {
            src: img.url,
            assetId: img.assetId,
          },
        })
      }
      return
    }

    // --- HANDLE TEXT BLOCKS ---
    if (block._type === 'block' && block.style) {
      const children = processBlockChildren(block)

      const isEffectivelyEmpty = children.length === 1 && children[0].text === ''
      const nodeContent = isEffectivelyEmpty ? {} : {content: children}

      switch (block.style) {
        case 'h1':
          content.push({type: 'heading', attrs: {level: 1}, ...nodeContent})
          break
        case 'h2':
          content.push({type: 'heading', attrs: {level: 2}, ...nodeContent})
          break
        case 'h3':
          content.push({type: 'heading', attrs: {level: 3}, ...nodeContent})
          break
        case 'blockquote':
          content.push({type: 'blockquote', content: [{type: 'paragraph', ...nodeContent}]})
          break
        default:
          content.push({type: 'paragraph', ...nodeContent})
      }
    }
  })

  if (currentList) {
    content.push(currentList)
  }

  return {type: 'doc', content}
}

function processBlockChildren(block: PortableTextBlock): TiptapNode[] {
  const children = Array.isArray(block.children) ? block.children : []

  const processedChildren = children
    .filter((span) => span && span._type === 'span')
    .map((span) => {
      const marks = (Array.isArray(span.marks) ? span.marks : []).map((mark) => {
          const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
          const markDef = markDefs.find((def) => def._key === mark)
          if (markDef?._type === 'link') {
            return {type: 'link', attrs: {href: (markDef as any).href}}
          }
          if (markDef?._type === 'color') {
            return {type: 'textStyle', attrs: {color: (markDef as any).hex}}
          }
          if (mark === 'strong') return {type: 'bold'}
          if (mark === 'em') return {type: 'italic'}
          return null
        })
        .filter(Boolean) as {type: string; attrs?: any}[]

      return {
        type: 'text',
        text: span.text ?? '',
        marks,
      }
    })

  return processedChildren
}


