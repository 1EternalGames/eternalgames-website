import {defineField, defineType, Rule} from 'sanity'

export default defineType({
    name: 'tag',
    title: 'Tag',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Game Tag (For Reviews & Releases)', value: 'Game' },
                    { title: 'Article Category (For Articles)', value: 'Article' },
                    { title: 'News Category (For News)', value: 'News' }
                ],
                layout: 'radio'
            },
            validation: (Rule) => Rule.required(),
            initialValue: 'Game'
        }),
    ],
})