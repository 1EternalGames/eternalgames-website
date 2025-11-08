import {defineField, defineType, Rule} from 'sanity'

export default defineType({
    name: 'news',
    title: 'News',
    type: 'document',
    fields: [
        defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
        defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
        defineField({name: 'reporters', title: 'Reporters', type: 'array', of: [{type: 'reference', to: {type: 'reporter'}}], validation: (Rule) => Rule.required().min(1)}),
        defineField({name: 'designers', title: 'Designers (Optional)', type: 'array', of: [{type: 'reference', to: {type: 'designer'}}]}),
        // THE DEFINITIVE FIX: Changed from a static string list to a single reference to a categorized tag.
        defineField({
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: {type: 'tag'},
            options: {
                filter: 'category == "News"'
            },
            validation: (Rule) => Rule.required()
        }),
        defineField({name: 'game', title: 'Game (Optional)', type: 'reference', to: {type: 'game'}}),
        defineField({name: 'mainImage', title: 'Main image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
        defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
        defineField({name: 'content', title: 'Content', type: 'blockContent'}),
        defineField({name: 'relatedNews', title: 'Related News', type: 'array', of: [{type: 'reference', to: {type: 'news'}}]}),
        defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
    ],
    preview: {
        select: {title: 'title', media: 'mainImage', category: 'category.title'},
        prepare(selection) {
            const { category } = selection
            return {...selection, subtitle: category}
        }
    },
})