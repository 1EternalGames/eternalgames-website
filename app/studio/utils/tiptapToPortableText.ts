// app/studio/utils/tiptapToPortableText.ts

import {v4 as uuidv4} from 'uuid'

// Type definitions for Tiptap's JSON structure
interface TiptapNode {
  type: string
  attrs?: Record<string, any>
  content?: TiptapNode[]
  text?: string
  marks?: {type: string; attrs?: Record<string, any>}[]
}

/**
 * Converts a Tiptap JSON object to a Sanity Portable Text array.
 * @param tiptapJSON The Tiptap JSON object.
 * @returns An array of Portable Text blocks.
 */
export function tiptapToPortableText(tiptapJSON: TiptapNode): any[] {
  if (!tiptapJSON || tiptapJSON.type !== 'doc' || !tiptapJSON.content) {
    return []
  }

  const portableTextBlocks: any[] = []

  tiptapJSON.content.forEach((node) => {
    // --- YOUTUBE ---
    if (node.type === 'youtube') {
      const {src} = node.attrs || {}
      if (src) {
        portableTextBlocks.push({
          _type: 'youtube',
          _key: uuidv4(),
          url: src,
        })
      }
      return
    }

    // --- IMAGE COMPARE ---
    if (node.type === 'imageCompare') {
      const {assetId1, assetId2, 'data-size': size} = node.attrs || {}
      portableTextBlocks.push({
        _type: 'imageCompare',
        _key: uuidv4(),
        image1: assetId1 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId1}} : undefined,
        image2: assetId2 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId2}} : undefined,
        size: size || 'large',
      })
      return
    }

    // --- TWO IMAGE GRID ---
    if (node.type === 'twoImageGrid') {
      const {assetId1, assetId2} = node.attrs || {}
      portableTextBlocks.push({
        _type: 'twoImageGrid',
        _key: uuidv4(),
        image1: assetId1 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId1}} : undefined,
        image2: assetId2 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId2}} : undefined,
      })
      return
    }

    // --- FOUR IMAGE GRID ---
    if (node.type === 'fourImageGrid') {
      const {assetId1, assetId2, assetId3, assetId4} = node.attrs || {}
      portableTextBlocks.push({
        _type: 'fourImageGrid',
        _key: uuidv4(),
        image1: assetId1 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId1}} : undefined,
        image2: assetId2 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId2}} : undefined,
        image3: assetId3 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId3}} : undefined,
        image4: assetId4 ? {_type: 'image', asset: {_type: 'reference', _ref: assetId4}} : undefined,
      })
      return
    }

    // --- GAME DETAILS ---
    if (node.type === 'gameDetails') {
      portableTextBlocks.push({
        _type: 'gameDetails',
        _key: uuidv4(),
        details: node.attrs?.details || [],
      })
      return
    }

    // --- TABLE (THE DEFINITIVE FIX) ---
    if (node.type === 'table') {
      const tableRows: any[] = []
      // Tiptap's table content is an array of 'tableRow' nodes.
      // The previous implementation had an extra incorrect level of nesting.
      ;(node.content || []).forEach((rowNode: TiptapNode) => {
        const tableCells: any[] = []
        ;(rowNode.content || []).forEach((cellNode: TiptapNode) => {
          tableCells.push({
            _key: uuidv4(),
            _type: 'cell',
            isHeader: cellNode.type === 'tableHeader',
            // Recursively convert the cell's content.
            content: tiptapToPortableText({type: 'doc', content: cellNode.content || []}),
          })
        })
        tableRows.push({_key: uuidv4(), _type: 'row', cells: tableCells})
      })
      portableTextBlocks.push({_type: 'table', _key: uuidv4(), rows: tableRows})
      return
    }

    // --- IMAGE (DEFINITIVE FIX) ---
    if (node.type === 'image') {
      const assetId = node.attrs?.assetId
      if (assetId) {
        portableTextBlocks.push({
          _type: 'image',
          _key: uuidv4(),
          asset: {_type: 'reference', _ref: assetId},
        })
      } else if (node.attrs?.src) {
        const matches = node.attrs.src.match(/image-([a-fA-F0-9]+-[0-9]+x[0-9]+-[a-z]+)/)
        if (matches && matches[1]) {
          const parsedId = `image-${matches[1]}`
          portableTextBlocks.push({
            _type: 'image',
            _key: uuidv4(),
            asset: {_type: 'reference', _ref: parsedId},
          })
        }
      }
      return
    }

    // --- BULLET LISTS ---
    if (node.type === 'bulletList') {
      node.content?.forEach((listItem) => {
        const paragraph = listItem.content?.[0]
        if (paragraph && paragraph.type === 'paragraph') {
          const block = processTextBlock(paragraph)
          if (block) {
            block.level = 1
            block.listItem = 'bullet'
            portableTextBlocks.push(block)
          }
        }
      })
      return
    }

    // --- STANDARD TEXT BLOCKS ---
    const block = processTextBlock(node)
    if (block) {
      portableTextBlocks.push(block)
    }
  })

  return portableTextBlocks
}

// Helper function to process paragraphs, headings, blockquotes
function processTextBlock(node: TiptapNode): any | null {
  const block: any = {
    _type: 'block',
    _key: uuidv4(),
    children: [],
    markDefs: [],
  }

  switch (node.type) {
    case 'heading':
      block.style = `h${node.attrs?.level || 2}`
      break
    case 'blockquote':
      if (node.content && node.content.length > 0) {
        const blockquoteParagraph = processTextBlock({type: 'paragraph', content: node.content})
        if (blockquoteParagraph) {
          blockquoteParagraph.style = 'blockquote'
          return blockquoteParagraph
        }
      }
      return null
    default:
      block.style = 'normal'
  }

  ;(node.content || []).forEach((span) => {
    if (span.type !== 'text' || typeof span.text === 'undefined') return

    const spanMarks: string[] = []
    span.marks?.forEach((mark) => {
      if (mark.type === 'bold') spanMarks.push('strong')
      if (mark.type === 'italic') spanMarks.push('em')
      if (mark.type === 'link') {
        const markDef = {_key: uuidv4(), _type: 'link', href: mark.attrs?.href}
        block.markDefs.push(markDef)
        spanMarks.push(markDef._key)
      }
      if (mark.type === 'textStyle' && mark.attrs?.color) {
        const markDef = {_key: uuidv4(), _type: 'color', hex: mark.attrs.color}
        block.markDefs.push(markDef)
        spanMarks.push(markDef._key)
      }
    })

    block.children.push({
      _type: 'span',
      _key: uuidv4(),
      text: span.text,
      marks: spanMarks,
    })
  })

  if (block.children.length === 0) {
    block.children.push({_type: 'span', _key: uuidv4(), text: '', marks: []})
  }

  return block
}


