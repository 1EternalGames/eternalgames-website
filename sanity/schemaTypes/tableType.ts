// sanity/schemaTypes/tableType.ts
import {defineType, defineField, defineArrayMember} from 'sanity'
import {ListIcon} from '@sanity/icons'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'cell',
                  fields: [
                    defineField({
                      name: 'content',
                      title: 'Content',
                      type: 'array',
                      of: [defineArrayMember({type: 'block'})],
                    }),
                    defineField({
                      name: 'isHeader',
                      title: 'Is Header Cell?',
                      type: 'boolean',
                      initialValue: false,
                    }),
                  ],
                  preview: {
                    select: {
                      content: 'content',
                    },
                    prepare({content}) {
                      const text = content?.[0]?.children?.[0]?.text || 'Empty Cell'
                      return {title: text}
                    },
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare({rows}) {
      const rowCount = rows ? rows.length : 0
      const colCount = rows?.[0]?.cells?.length || 0
      return {
        title: 'Table Block',
        subtitle: rowCount > 0 ? `${rowCount} rows, ${colCount} columns` : 'Empty table',
      }
    },
  },
})


