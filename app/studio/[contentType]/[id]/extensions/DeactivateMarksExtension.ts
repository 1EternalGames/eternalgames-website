// app/studio/[contentType]/[id]/extensions/DeactivateMarksExtension.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Step } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view'; // <-- IMPORT THE NECESSARY TYPE

export const DeactivateMarksExtension = Extension.create({
    name: 'deactivateMarks',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('deactivateMarks'),

                // This handles the spacebar press directly.
                // THE FIX: Added explicit types for all parameters.
                handleTextInput: (view: EditorView, from: number, to: number, text: string) => {
                    // Check if the input is a space and if there are stored marks.
                    if (text === ' ' && view.state.storedMarks && view.state.storedMarks.length > 0) {
                        // If yes, dispatch a transaction to clear the stored marks.
                        view.dispatch(view.state.tr.setStoredMarks([]));
                    }
                    // Return false to allow the default input handling to proceed (i.e., inserting the space).
                    return false;
                },

                // This handles moving the cursor with arrow keys or mouse clicks.
                appendTransaction: (transactions, oldState, newState) => {
                    const hasSelectionChanged = !oldState.selection.eq(newState.selection);

                    // If the selection changed to a single cursor point and there are stored marks...
                    if (hasSelectionChanged && newState.selection.empty && newState.storedMarks && newState.storedMarks.length > 0) {
                        // ...create and return a new transaction that clears them.
                        return newState.tr.setStoredMarks([]);
                    }

                    return null;
                },
            }),
        ];
    },
});