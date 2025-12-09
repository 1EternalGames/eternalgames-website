// components/studio/social/extensions/RandomEnglishStyleExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Simple hash function to deterministically pick a style based on the phrase content
const getStyleForPhrase = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const styles = ['white', 'cyan'];
    return styles[Math.abs(hash) % styles.length];
};

export const RandomEnglishStyleExtension = Extension.create({
    name: 'randomEnglishStyle',

    addProseMirrorPlugins() {
        const { editor } = this;

        return [
            new Plugin({
                key: new PluginKey('randomEnglishStyle'),
                appendTransaction: (transactions, oldState, newState) => {
                    const docChanged = transactions.some(transaction => transaction.docChanged);
                    if (!docChanged) return null;

                    const tr = newState.tr;
                    let modified = false;

                    const textStyleMark = editor.schema.marks.textStyle;
                    
                    // Regex for English Sequences:
                    // Matches a word, optionally followed by (space + word) repeatedly.
                    // This groups "Dead Space" into one match, but "Dead العربية Space" into two separate matches.
                    const englishSequenceRegex = /\b[a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)?(?:\s+[a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)?)*\b/g;

                    newState.doc.descendants((node, pos) => {
                        if (!node.isText) return;
                        
                        const text = node.text;
                        if (!text) return;
                        
                        let match;
                        while ((match = englishSequenceRegex.exec(text)) !== null) {
                            const start = pos + match.index;
                            const end = start + match[0].length;
                            const phrase = match[0];
                            
                            // Check if this range already has a color mark (manual override)
                            // If the user manually colored it, we generally skip to avoid fighting them.
                            // However, since this is "Automatic", we rely on the editor's behavior.
                            // We check the first character of the match to see if it has the mark.
                            const hasColor = textStyleMark.isInSet(node.marks);
                            
                            if (!hasColor) {
                                // Determine style for the entire phrase
                                const styleType = getStyleForPhrase(phrase);
                                
                                if (styleType === 'white') {
                                    tr.addMark(start, end, textStyleMark.create({ color: '#FFFFFF' }));
                                } else if (styleType === 'cyan') {
                                    tr.addMark(start, end, textStyleMark.create({ color: '#00FFF0' }));
                                }
                                modified = true;
                            }
                        }
                    });

                    if (!modified) return null;

                    return tr;
                },
            }),
        ];
    },
});