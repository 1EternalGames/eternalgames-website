// app/studio/[contentType]/[id]/extensions/DeactivateMarksExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from 'prosemirror-view';

export const DeactivateMarksExtension = Extension.create({
    name: 'deactivateMarks',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('deactivateMarks'),
                props: {
                    handleTextInput: (view: EditorView, from: number, to: number, text: string) => {
                        // Detect when the user types a Space
                        if (text === ' ' && view.state.selection.empty) {
                            // Check for ANY active marks at the current cursor position.
                            // 'storedMarks' are marks toggled on but not typed yet (e.g., clicking 'B' button).
                            // '$from.marks()' are marks on the character immediately preceding the cursor.
                            const currentMarks = view.state.storedMarks || view.state.selection.$from.marks();

                            if (currentMarks && currentMarks.length > 0) {
                                // 1. Insert the space. The space itself will inherit the previous marks (keeping the word visually intact).
                                const tr = view.state.tr.insertText(text, from, to);
                                
                                // 2. Forcefully clear the "stored marks" for the NEXT character to be typed.
                                // This ensures the user "steps out" of Bold/Italic/Color immediately after the space.
                                tr.setStoredMarks([]);
                                
                                view.dispatch(tr);
                                return true; // Tell the editor we handled this input manually.
                            }
                        }
                        return false; // Let the editor handle non-space inputs normally.
                    },
                },
            }),
        ];
    },
});