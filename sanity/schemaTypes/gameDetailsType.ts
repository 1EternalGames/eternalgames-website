// sanity/schemaTypes/gameDetailsType.ts
import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'gameDetails',
  title: 'Game Details',
  type: 'object',
  fields: [
    defineField({
      name: 'details',
      title: 'Details',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'detailItem',
          fields: [
            defineField({
              name: 'label',
              title: 'Label (Arabic)',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value (English or Arabic)',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'value',
              subtitle: 'label',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      readOnly: true,
      description: 'This value is set automatically by resizing the block in the editor.',
    }),
  ],
  preview: {
    select: {
      details: 'details',
    },
    prepare({ details }) {
      const count = details ? details.length : 0;
      return {
        title: 'Game Details Block',
        subtitle: `${count} detail(s)`,
      };
    },
  },
});