import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'reporter',
    title: 'Reporter', // For News
    type: 'document',
    fields: [
        defineField({ name: 'name', title: 'Name', type: 'string', readOnly: true }),
        defineField({ name: 'prismaUserId', title: 'Prisma User ID', type: 'string', readOnly: true, validation: (Rule) => Rule.unique()}),
        defineField({ name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    ],
    preview: { select: { title: 'name', media: 'image' }},
})


