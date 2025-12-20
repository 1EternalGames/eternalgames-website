import {defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export default defineType({
  name: 'homepageSettings',
  title: 'Homepage Settings',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'releasesCredits',
      title: 'Releases Section Credits',
      description: 'The team members credited for curating the releases timeline.',
      type: 'array',
      of: [{
        type: 'reference', 
        to: [
          {type: 'reviewer'}, 
          {type: 'author'}, 
          {type: 'reporter'}, 
          {type: 'designer'}
        ]
      }],
      validation: (Rule) => Rule.unique(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Homepage Settings',
      }
    },
  },
})


