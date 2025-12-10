// components/studio/social/extensions/FirstWordColorExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface FirstWordColorOptions {
    color: string;
}

export const FirstWordColorExtension = Extension.create<FirstWordColorOptions>({
    name: 'firstWordColor',

    addOptions() {
        return {
            color: '#00FFF0', // Default Cyan
        };
    },

    addProseMirrorPlugins() {
        const { editor, options } = this;

        return [
            new Plugin({
                key: new PluginKey('firstWordColor'),
                appendTransaction: (transactions, oldState, newState) => {
                    const docChanged = transactions.some(transaction => transaction.docChanged);
                    if (!docChanged) return null;

                    const tr = newState.tr;
                    const textStyleMark = editor.schema.marks.textStyle;
                    
                    let firstTextNodeFound = false;
                    let modified = false;

                    newState.doc.descendants((node, pos) => {
                        if (firstTextNodeFound) return false; 

                        if (node.isText && node.text) {
                            firstTextNodeFound = true;
                            
                            // Regex to find the first word (non-whitespace sequence)
                            const match = node.text.match(/^(\s*)([^\s]+)/);
                            
                            if (match) {
                                const [fullMatch, leadingSpace, firstWord] = match;
                                const start = pos + leadingSpace.length;
                                const end = start + firstWord.length;

                                // Check if it already has the CORRECT color
                                const hasCorrectColor = node.marks.some(m => 
                                    m.type.name === 'textStyle' && m.attrs.color === options.color
                                );

                                if (!hasCorrectColor) {
                                    if (textStyleMark) {
                                        // Remove any existing textStyle marks on this range first
                                        tr.removeMark(start, end, textStyleMark);
                                        // Add the new color mark
                                        tr.addMark(start, end, textStyleMark.create({ color: options.color }));
                                        modified = true;
                                    }
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