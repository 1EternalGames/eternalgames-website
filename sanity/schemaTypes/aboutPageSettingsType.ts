import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons'

export default defineType({
  name: 'aboutPageSettings',
  title: 'About Page Settings',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'ceo',
      title: 'CEO',
      type: 'reference',
      to: [{type: 'reviewer'}, {type: 'author'}, {type: 'reporter'}, {type: 'designer'}]
    }),
    
    // Leadership Group
    defineField({
      name: 'headOfCommunication',
      title: 'Head of Communication',
      type: 'reference',
      to: [{type: 'reviewer'}, {type: 'author'}, {type: 'reporter'}, {type: 'designer'}]
    }),
    defineField({
      name: 'headOfReviews',
      title: 'Head of Reviews',
      type: 'reference',
      to: [{type: 'reviewer'}, {type: 'author'}, {type: 'reporter'}, {type: 'designer'}]
    }),
    defineField({
      name: 'editorInChief',
      title: 'Editor in Chief (رئيس التحرير)',
      type: 'reference',
      to: [{type: 'reviewer'}, {type: 'author'}, {type: 'reporter'}, {type: 'designer'}]
    }),
    defineField({
      name: 'headOfVisuals',
      title: 'Head of Visuals',
      type: 'reference',
      to: [{type: 'reviewer'}, {type: 'author'}, {type: 'reporter'}, {type: 'designer'}]
    }),

    // Teams
    defineField({
      name: 'reportersSection',
      title: 'Reporters Team',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'reporter'}, {type: 'author'}, {type: 'reviewer'}, {type: 'designer'}]}]
    }),
    defineField({
      name: 'authorsSection',
      title: 'Authors Team',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'author'}, {type: 'reporter'}, {type: 'reviewer'}, {type: 'designer'}]}]
    }),
    defineField({
      name: 'designersSection',
      title: 'Designers Team',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'designer'}, {type: 'author'}, {type: 'reporter'}, {type: 'reviewer'}]}]
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'About Page Configuration',
      }
    },
  },
})