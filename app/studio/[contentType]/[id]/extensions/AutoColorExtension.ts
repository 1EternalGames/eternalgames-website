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
          const sortedMappings = [...colorMappings].sort((a, b) => b.word.length - a.word.length);
          const wordsToFind = sortedMappings.map(m => escapeRegExp(m.word)).join('|');
          const searchRegex = new RegExp(`\\b(${wordsToFind})\\b`, 'gi');
          
          const colorMap = new Map<string, string>();
          colorMappings.forEach(m => colorMap.set(m.word.toLowerCase(), m.color));
          
          const textStyleMark = this.editor.schema.marks.textStyle;

          newState.doc.forEach((node, pos) => {
            if (!node.isTextblock) return;

            const text = node.textContent;
            if (!text) return;

            // 1. Calculate Desired Matches
            const matches: {start: number, end: number, color: string}[] = [];
            let match;
            searchRegex.lastIndex = 0;
            
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

            // 2. Apply Matches ONLY
            // FIX: We removed the aggressive "Cleanup" loop that was stripping all managed colors from the block.
            // Now we only ADD colors to matching words. This prevents the extension from fighting against
            // manual color selections that happen to use the same hex codes as the dictionary.
            
            matches.forEach(m => {
                // We add the mark. If it already exists, Prosemirror handles the merge efficiently.
                tr.addMark(m.start, m.end, textStyleMark.create({ color: m.color }));
                modified = true;
            });
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