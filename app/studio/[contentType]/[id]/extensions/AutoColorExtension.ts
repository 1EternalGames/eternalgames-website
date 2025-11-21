// app/studio/[contentType]/[id]/extensions/AutoColorExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

type ColorMapping = {
  word: string;
  color: string;
};

export interface AutoColorOptions {
  colorMappings: ColorMapping[];
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const AutoColorExtension = Extension.create<AutoColorOptions>({
  name: 'autoColor',

  addOptions() {
    return {
      colorMappings: [],
    };
  },

  addProseMirrorPlugins() {
    const { colorMappings } = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('autoColorApply'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some(transaction => transaction.docChanged);
          if (!docChanged || colorMappings.length === 0) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          // Prepare regex and color map
          // We sort by length descending to match longest words first if there are overlaps
          const sortedMappings = [...colorMappings].sort((a, b) => b.word.length - a.word.length);
          const wordsToFind = sortedMappings.map(m => escapeRegExp(m.word)).join('|');
          // Use 'gi' for case-insensitive matching, respecting word boundaries
          const searchRegex = new RegExp(`\\b(${wordsToFind})\\b`, 'gi');
          
          const colorMap = new Map<string, string>();
          colorMappings.forEach(m => colorMap.set(m.word.toLowerCase(), m.color));
          
          const managedColors = new Set(colorMappings.map(m => m.color));
          const textStyleMark = this.editor.schema.marks.textStyle;

          newState.doc.forEach((node, pos) => {
            if (!node.isTextblock) return;

            const text = node.textContent;
            if (!text) return;

            // 1. Calculate Desired Matches based on current text content
            const matches: {start: number, end: number, color: string}[] = [];
            let match;
            searchRegex.lastIndex = 0; // Reset regex
            
            while ((match = searchRegex.exec(text)) !== null) {
                const word = match[0];
                const color = colorMap.get(word.toLowerCase());
                if (color) {
                    matches.push({
                        start: pos + 1 + match.index,
                        end: pos + 1 + match.index + word.length,
                        color
                    });
                }
            }

            // 2. Check if Update is Needed (Reconciliation)
            // We assume the block needs an update unless proved otherwise.
            // To prove it's valid, every text node must exactly match the expected color state.
            let needsUpdate = false;
            
            let currentPos = pos + 1;
            
            // Iterate over the node's content (text nodes and inline nodes)
            node.content.forEach((child) => {
                if (needsUpdate) return; // Optimization: stop if we already know we need to update
                
                if (!child.isText) {
                    currentPos += child.nodeSize;
                    return;
                }
                
                const childEnd = currentPos + child.text!.length;
                
                // Check for any existing managed mark on this text node
                const hasManagedColor = child.marks.find(m => m.type.name === 'textStyle' && m.attrs.color && managedColors.has(m.attrs.color));
                
                if (hasManagedColor) {
                    const currentColor = hasManagedColor.attrs.color;
                    // Valid if this ENTIRE text node range falls within a 'match' of the same color.
                    // If a text node has a color but isn't part of a valid word match (e.g. "xbox" inside "xboxo"), it's invalid.
                    const isValid = matches.some(m => 
                        m.color === currentColor && 
                        m.start <= currentPos && 
                        m.end >= childEnd
                    );
                    if (!isValid) needsUpdate = true;
                } else {
                    // Valid if this text node does NOT overlap with any match.
                    // If it overlaps a match, it implies it SHOULD have a color but doesn't.
                    const isMissingColor = matches.some(m => 
                        Math.max(currentPos, m.start) < Math.min(childEnd, m.end)
                    );
                    if (isMissingColor) needsUpdate = true;
                }
                
                currentPos += child.nodeSize;
            });

            // 3. Apply Update if needed
            if (needsUpdate) {
                modified = true;
                const blockStart = pos + 1;
                const blockEnd = pos + 1 + node.content.size;

                // Strip all managed colors from this block first (Cleanup)
                managedColors.forEach(color => {
                    tr.removeMark(blockStart, blockEnd, textStyleMark.create({ color }));
                });

                // Apply the correct colors (Application)
                matches.forEach(m => {
                    tr.addMark(m.start, m.end, textStyleMark.create({ color: m.color }));
                });
            }
          });

          if (!modified) {
            return null;
          }

          return tr;
        },
      }),
    ];
  },
});