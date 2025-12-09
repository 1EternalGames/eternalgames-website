// components/studio/social/extensions/TextStrokeMark.ts
import { Mark, mergeAttributes } from '@tiptap/core';

export const TextStrokeMark = Mark.create({
  name: 'textStroke',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => (element as HTMLElement).classList.contains('text-stroke-effect') && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'text-stroke-effect' }), 0];
  },
});