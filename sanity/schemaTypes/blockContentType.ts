import {defineType, defineArrayMember, defineField} from 'sanity'

/**
 * This is the schema definition for the rich text fields used for
 * author biography, collaborator details, and sub-descriptions.
 **/
export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              defineField({
                title: 'URL',
                name: 'href',
                type: 'url',
              }),
            ],
          },
          {
            name: 'color',
            title: 'Color',
            type: 'object',
            fields: [
              {
                name: 'hex',
                title: 'Hex',
                type: 'string',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
    }),
    defineArrayMember({
      type: 'imageCompare',
    }),
    defineArrayMember({
      type: 'twoImageGrid',
    }),
    defineArrayMember({
      type: 'fourImageGrid',
    }),
    defineArrayMember({
      name: 'table',
      title: 'Table',
      type: 'table',
    }),
  ],
})