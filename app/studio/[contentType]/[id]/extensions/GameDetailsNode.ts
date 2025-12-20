// app/studio/[contentType]/[id]/extensions/GameDetailsNode.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GameDetailsComponent } from '../editor-components/GameDetailsComponent';

export const GameDetailsNode = Node.create({
  name: 'gameDetails',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      details: {
        default: [{ label: 'الناشر', value: '' }],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="game-details"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'game-details' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GameDetailsComponent);
  },
});


