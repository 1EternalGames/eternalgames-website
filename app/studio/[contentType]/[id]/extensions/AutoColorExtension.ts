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
    
    // THE DEFINITIVE FIX: This new implementation is more performant and less disruptive.
    // It scans the document only for words that *should* be colored but currently aren't.
    // It avoids removing and re-adding marks on every change, which was causing the editor
    // to lose track of the active color mark at the cursor position.
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
          
          const textStyleMark = this.editor.schema.marks.textStyle;

          newState.doc.forEach((node: ProsemirrorNode, pos: number) => {
            if (!node.isBlock || !node.textContent) {
              return;
            }

            node.forEach((childNode: ProsemirrorNode, offset: number) => {
              if (!childNode.isText) return;

              const text = childNode.text ?? '';
              let match;

              while ((match = searchRegex.exec(text)) !== null) {
                const matchedWord = match[0];
                const from = pos + 1 + offset + match.index;
                const to = from + matchedWord.length;

                const hasColorMark = newState.doc.rangeHasMark(from, to, textStyleMark);
                
                // Only apply the mark if one doesn't already exist.
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

          // Return the transaction without setting 'addToHistory' to false,
          // allowing the changes to be part of the undo stack.
          return tr;
        },
      }),
    ];
  },
});