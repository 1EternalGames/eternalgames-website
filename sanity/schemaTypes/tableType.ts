// sanity/schemaTypes/tableType.ts
import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableRow',
          fields: [
            defineField({
              name: '_isHeader',
              title: 'Header Row',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [defineArrayMember({type: 'string'})],
            }),
          ],
          preview: {
            select: {
              cells: 'cells',
              isHeader: '_isHeader'
            },
            prepare({cells, isHeader}) {
              return {
                title: (cells || []).join(' | '),
                subtitle: isHeader ? 'Header Row' : 'Row'
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows'
    },
    prepare({rows}) {
      const rowCount = rows ? rows.length : 0
      return {
        title: 'Table',
        subtitle: `${rowCount} row${rowCount !== 1 ? 's' : ''}`
      }
    }
  }
})