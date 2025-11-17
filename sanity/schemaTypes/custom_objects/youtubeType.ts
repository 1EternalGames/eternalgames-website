// sanity/schemaTypes/custom_objects/youtubeType.ts
import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export default defineType({
  name: 'youtube',
  title: 'YouTube Embed',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube Video URL',
      type: 'url',
      validation: (Rule) =>
        Rule.required().regex(
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
          {
            name: 'youtube-url',
            invert: false,
          },
        ),
    }),
  ],
  preview: {
    select: {
      url: 'url',
    },
    prepare({url}) {
      return {
        title: 'YouTube Embed',
        subtitle: url,
      }
    },
  },
})