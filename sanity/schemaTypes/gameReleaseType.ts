import {defineField, defineType, Rule} from 'sanity'

export default defineType({
name: 'gameRelease',
title: 'Game Release',
type: 'document',
fields: [
defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
defineField({name: 'releaseDate', title: 'Release Date', type: 'date', validation: (Rule) => Rule.required()}),
defineField({name: 'platforms', title: 'Platforms', type: 'array', of: [{type: 'string'}], options: {list: ['PC', 'PS5', 'Xbox', 'Switch']}}),
defineField({name: 'mainImage', title: 'Main Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
defineField({name: 'synopsis', title: 'Synopsis', type: 'text', validation: (Rule) => Rule.required()}),
defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
],
preview: {
select: {title: 'title', subtitle: 'releaseDate', media: 'mainImage'},
},
})


