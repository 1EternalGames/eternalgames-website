import {defineField, defineType, Rule} from 'sanity'

export default defineType({
  name 'publisher',
  title 'Publisher',
  type 'document',
  fields [
    defineField({
      name 'title',
      title 'Name',
      type 'string',
      validation (Rule) = Rule.required(),
    }),
    defineField({
      name 'slug',
      title 'Slug',
      type 'slug',
      options {
        source 'title',
        maxLength 96,
      },
      validation (Rule) = Rule.required(),
    }),
  ],
})