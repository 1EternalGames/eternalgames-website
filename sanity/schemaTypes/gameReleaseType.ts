import {defineField, defineType, Rule} from 'sanity'

export default defineType({
name: 'gameRelease',
title: 'Game Release',
type: 'document',
fields: [
defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
defineField({name: 'game', title: 'Game', type: 'reference', to: {type: 'game'}, validation: (Rule) => Rule.required()}),
defineField({name: 'releaseDate', title: 'Release Date', type: 'date', validation: (Rule) => Rule.required()}),
defineField({name: 'platforms', title: 'Platforms', type: 'array', of: [{type: 'string'}], options: {list: ['PC', 'PlayStation', 'Xbox', 'Switch']}}),
defineField({name: 'mainImage', title: 'Main Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
defineField({name: 'synopsis', title: 'Synopsis', type: 'text', validation: (Rule) => Rule.required()}),
defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'reference', to: {type: 'tag'}, options: { filter: 'category == "Game"' }}]}),
defineField({name: 'designers', title: 'Designers (Optional)', type: 'array', of: [{type: 'reference', to: {type: 'designer'}}]}),
defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
],
preview: {
select: {title: 'title', subtitle: 'releaseDate', media: 'mainImage'},
},
})