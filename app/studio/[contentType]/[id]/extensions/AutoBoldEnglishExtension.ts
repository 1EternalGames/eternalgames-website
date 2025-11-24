// app/studio/[contentType]/[id]/extensions/AutoBoldEnglishExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const AutoBoldEnglishExtension = Extension.create({
  name: 'autoBoldEnglish',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoBoldEnglish'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some(transaction => transaction.docChanged);
          if (!docChanged) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;
          const boldMark = this.editor.schema.marks.bold;

          if (!boldMark) return null;

          // Regex to find English words (Latin alphabet sequences)
          // Includes handling for apostrophes (e.g., "don't", "user's")
          const englishRegex = /\b[a-zA-Z]+(?:['’][a-zA-Z]+)?\b/g;

          newState.doc.descendants((node, pos) => {
            if (!node.isText) return;
            
            // Optimization: If the entire text node is already bold, we skip regex scanning
            if (boldMark.isInSet(node.marks)) return;

            const text = node.text;
            if (!text) return;

            let match;
            englishRegex.lastIndex = 0; // Reset regex state

            while ((match = englishRegex.exec(text)) !== null) {
              const start = pos + match.index;
              const end = start + match[0].length;

              // Apply bold mark to the English word range
              tr.addMark(start, end, boldMark.create());
              modified = true;
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