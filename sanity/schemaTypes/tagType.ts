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
                    { title: 'Game (For Reviews & Articles)', value: 'Game' },
                    { title: 'News (For News only)', value: 'News' },
                    { title: 'Article (For Articles only)', value: 'Article' }
                ],
                layout: 'radio'
            },
            validation: (Rule) => Rule.required(),
            initialValue: 'Game'
        }),
    ],
})


