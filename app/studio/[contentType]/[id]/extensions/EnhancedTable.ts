// app/studio/[contentType]/[id]/extensions/EnhancedTable.ts
import Table from '@tiptap/extension-table';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Node } from '@tiptap/pm/model';

/**
 * Checks if the selection is inside a table cell and if that cell is empty or the cursor is at the start.
 * @param selection The current editor selection.
 * @returns boolean
 */
const isAtStartOfTableCell = (selection: any): boolean => {
    // We only care about cursor selections, not range selections.
    if (!selection.empty || !selection.$head) {
        return false;
    }
    
    // Check if the cursor is inside a table cell or header.
    const cell = selection.$head.parent;
    if (cell.type.name !== 'tableCell' && cell.type.name !== 'tableHeader') {
        return false;
    }
    
    // Check if the cell has no text content.
    const cellContentIsEmpty = cell.textContent.trim() === '';
    
    // Check if the cursor is at the very beginning of the cell's content.
    // Tiptap cells contain paragraphs, so the cursor position relative to the cell start is `selection.$head.pos - selection.$head.start(-1)`.
    const isAtStart = selection.$head.parentOffset === 0;

    return cellContentIsEmpty || isAtStart;
};


export const EnhancedTable = Table.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('enhanced-table-handling'),
        props: {
          handleKeyDown: (view, event) => {
            // Check for Backspace or Delete key.
            if (event.key !== 'Backspace' && event.key !== 'Delete') {
              return false; // Let other plugins handle it.
            }

            // Get the current selection from the editor state.
            const { selection } = view.state;

            if (isAtStartOfTableCell(selection)) {
              // We've met the condition: cursor at the start of a table cell.
              // We prevent the default key behavior and run our command.
              event.preventDefault();
              this.editor.chain().focus().deleteRow().run();
              return true; // We've handled this key press.
            }

            return false; // We did not handle this key press.
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Keep the Shift variants as a power-user feature for clarity.
      'Shift-Backspace': () => this.editor.chain().focus().deleteRow().run(),
      'Shift-Delete': () => this.editor.chain().focus().deleteRow().run(),
    };
  },
});