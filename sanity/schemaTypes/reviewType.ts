import {defineField, defineType, Rule} from 'sanity'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'game', title: 'Game', type: 'reference', to: {type: 'game'}, validation: (Rule) => Rule.required()}),
    defineField({name: 'authors', title: 'Reviewers', type: 'array', of: [{type: 'reference', to: {type: 'reviewer'}}], validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'designers', title: 'Designers (Optional)', type: 'array', of: [{type: 'reference', to: {type: 'designer'}}]}),
    defineField({name: 'mainImage', title: 'Main Image (Horizontal)', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'mainImageVertical', title: 'Vertical Image (Vanguard)', type: 'image', options: {hotspot: true}}),
    defineField({name: 'score', title: 'Score', type: 'number', validation: (Rule) => Rule.required().min(0).max(10)}),
    defineField({name: 'verdict', title: 'Verdict', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'pros', title: 'Pros', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'cons', title: 'Cons', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'reference', to: {type: 'tag'}, options: { filter: 'category == "Game"' }}]}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({name: 'content', title: 'Content', type: 'blockContent', validation: (Rule) => Rule.required()}),
    defineField({name: 'relatedReviews', title: 'Related Reviews', type: 'array', of: [{type: 'reference', to: {type: 'review'}}]}),
    defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
  ],
  preview: {
    select: {title: 'title', author: 'authors.0.name', media: 'mainImage'},
    prepare(selection: {author: string}) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})


