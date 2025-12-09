// components/studio/social/extensions/SocialDeactivateMarks.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from 'prosemirror-view';

export const SocialDeactivateMarks = Extension.create({
    name: 'socialDeactivateMarks',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('socialDeactivateMarks'),
                props: {
                    // Handle Space
                    handleTextInput: (view: EditorView, from: number, to: number, text: string) => {
                        if (text === ' ' && view.state.selection.empty) {
                            const currentMarks = view.state.storedMarks || view.state.selection.$from.marks();
                            if (currentMarks && currentMarks.length > 0) {
                                const tr = view.state.tr.insertText(text, from, to);
                                tr.setStoredMarks([]); // Clear marks for next char
                                view.dispatch(tr);
                                return true;
                            }
                        }
                        return false;
                    },
                    // Handle Enter
                    handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            const tr = view.state.tr.setStoredMarks([]);
                            view.dispatch(tr);
                            return false; // Allow default Enter behavior to proceed
                        }
                        return false;
                    }
                },
            }),
        ];
    },
});