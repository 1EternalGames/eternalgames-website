// app/studio/[contentType]/[id]/extensions/AutoColorExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Node as ProsemirrorNode } from 'prosemirror-model';

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

          const wordsToFind = colorMappings.map(m => escapeRegExp(m.word)).join('|');
          const searchRegex = new RegExp(`\\b(${wordsToFind})\\b`, 'gi');
          const colorMap = new Map(colorMappings.map(item => [item.word.toLowerCase(), item.color]));
          const dictionaryWords = new Set(colorMappings.map(item => item.word.toLowerCase()));
          
          const textStyleMark = this.editor.schema.marks.textStyle;

          newState.doc.forEach((node: ProsemirrorNode, pos: number) => {
            if (!node.isBlock || !node.textContent) {
              return;
            }

            // --- THE DEFINITIVE FIX: Two-pass reconciliation (Un-mark then Mark) ---

            // 1. Un-marking Pass: Remove incorrect color marks.
            let marksToRemove: { from: number, to: number, mark: any }[] = [];
            node.forEach((childNode: ProsemirrorNode, offset: number) => {
              if (!childNode.isText) return;

              childNode.marks.forEach(mark => {
                if (mark.type === textStyleMark && mark.attrs.color) {
                  const text = childNode.text ?? '';
                  if (!dictionaryWords.has(text.toLowerCase())) {
                    marksToRemove.push({
                      from: pos + 1 + offset,
                      to: pos + 1 + offset + childNode.nodeSize,
                      mark
                    });
                  }
                }
              });
            });

            marksToRemove.forEach(({ from, to, mark }) => {
              tr.removeMark(from, to, mark);
              modified = true;
            });


            // 2. Marking Pass: Add new, correct color marks.
            node.forEach((childNode: ProsemirrorNode, offset: number) => {
              if (!childNode.isText) return;

              const text = childNode.text ?? '';
              let match;

              while ((match = searchRegex.exec(text)) !== null) {
                const matchedWord = match[0];
                const from = pos + 1 + offset + match.index;
                const to = from + matchedWord.length;

                const hasColorMark = newState.doc.rangeHasMark(from, to, textStyleMark);
                
                if (!hasColorMark) {
                  const color = colorMap.get(matchedWord.toLowerCase());
                  if (color) {
                    tr.addMark(from, to, textStyleMark.create({ color }));
                    modified = true;
                  }
                }
              }
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