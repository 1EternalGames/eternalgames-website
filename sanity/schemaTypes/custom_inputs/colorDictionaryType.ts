// sanity/schemaTypes/custom_inputs/colorDictionaryType.ts
import {defineField, defineType} from 'sanity'
import {ColorWheelIcon} from '@sanity/icons'
import React from 'react' // ADDED: Import React

export default defineType({
  name: 'colorDictionary',
  title: 'Color Dictionary',
  type: 'document',
  icon: ColorWheelIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true, // This is a singleton, title is not needed for display
    }),
    defineField({
      name: 'autoColors',
      title: 'Automatic Word Colors',
      description: 'Define words that should be automatically colored when typed in the editor.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'colorMapping',
          fields: [
            defineField({
              name: 'word',
              title: 'Word',
              type: 'string',
              description: 'The exact word to color (case-sensitive).',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'color',
              title: 'Color',
              type: 'string',
              description: 'The hex color code (e.g., #00E5FF).',
              validation: (Rule) =>
                Rule.required().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
                  name: 'hexColor',
                  invert: false,
                }),
            }),
          ],
          preview: {
            select: {
              title: 'word',
              subtitle: 'color',
            },
            prepare({title, subtitle}) {
              return {
                title: title,
                subtitle: subtitle,
                // THE DEFINITIVE FIX: Use a function that returns a React element
                // This is valid in a .ts file and avoids the JSX syntax error.
                media: React.createElement('div', {
                  style: {
                    backgroundColor: subtitle || 'grey',
                    width: '100%',
                    height: '100%',
                  },
                }),
              }
            },
          },
        },
      ],
    }),
  ],
})


