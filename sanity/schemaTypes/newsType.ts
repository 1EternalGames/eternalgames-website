import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'news',
    title: 'News',
    type: 'document',
    fields: [
        defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
        defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
        defineField({name: 'reporters', title: 'Reporters', type: 'array', of: [{type: 'reference', to: {type: 'reporter'}}], validation: (Rule) => Rule.required().min(1)}),
        defineField({name: 'game', title: 'Game (Optional)', type: 'reference', to: {type: 'game'}}),
        defineField({name: 'mainImage', title: 'Main image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
        defineField({name: 'category', title: 'Category', type: 'string', options: {list: ["Industry", "Hardware", "Updates", "Esports"], layout: 'radio'}, validation: (Rule) => Rule.required()}),
        defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'reference', to: {type: 'tag'}, options: { filter: 'category == "News"' }}]}),
        defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
        defineField({name: 'content', title: 'Content', type: 'blockContent'}),
        defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
    ],
    preview: {
        select: {title: 'title', media: 'mainImage'},
    },
})