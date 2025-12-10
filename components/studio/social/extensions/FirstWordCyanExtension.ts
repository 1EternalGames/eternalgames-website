// components/studio/social/extensions/FirstWordCyanExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const FirstWordCyanExtension = Extension.create({
    name: 'firstWordCyan',

    addProseMirrorPlugins() {
        const { editor } = this;

        return [
            new Plugin({
                key: new PluginKey('firstWordCyan'),
                appendTransaction: (transactions, oldState, newState) => {
                    const docChanged = transactions.some(transaction => transaction.docChanged);
                    if (!docChanged) return null;

                    const tr = newState.tr;
                    const textStyleMark = editor.schema.marks.textStyle;
                    
                    // We only want to target the very first text node of the document
                    let firstTextNodeFound = false;
                    let modified = false;

                    newState.doc.descendants((node, pos) => {
                        if (firstTextNodeFound) return false; // Stop after first text node

                        if (node.isText && node.text) {
                            firstTextNodeFound = true;
                            
                            // Find the first word boundary
                            // Matches the first sequence of non-whitespace characters
                            const match = node.text.match(/^(\s*)([^\s]+)/);
                            
                            if (match) {
                                const [fullMatch, leadingSpace, firstWord] = match;
                                const start = pos + leadingSpace.length;
                                const end = start + firstWord.length;

                                // Check if it already has the specific cyan color
                                const hasCyan = node.marks.some(m => 
                                    m.type.name === 'textStyle' && m.attrs.color === '#00FFF0'
                                );

                                // If not, apply it
                                if (!hasCyan) {
                                    tr.addMark(start, end, textStyleMark.create({ color: '#00FFF0' }));
                                    modified = true;
                                }
                            }
                        }
                        return true;
                    });

                    if (!modified) return null;

                    return tr;
                },
            }),
        ];
    },
});