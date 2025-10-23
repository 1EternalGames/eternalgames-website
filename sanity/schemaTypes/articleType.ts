import {defineField, defineType} from 'sanity'

export default defineType({
name: 'article',
title: 'Article',
type: 'document',
fields: [
defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
defineField({name: 'slug', title: 'slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
defineField({name: 'game', title: 'Game', type: 'reference', to: {type: 'game'}, validation: (Rule) => Rule.required()}),
defineField({name: 'authors', title: 'Authors', type: 'array', of: [{type: 'reference', to: {type: 'author'}}], validation: (Rule) => Rule.required().min(1)}),
defineField({name: 'designers', title: 'Designers (Optional)', type: 'array', of: [{type: 'reference', to: {type: 'designer'}}]}),
defineField({name: 'mainImage', title: 'Main image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
defineField({name: 'tags', title: 'Tags', type: 'array', of: [{type: 'reference', to: {type: 'tag'}, options: { filter: 'category in ["Game", "Article"]' }}]}),
defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
defineField({name: 'content', title: 'Content', type: 'blockContent'}),
defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
],
preview: {
select: {title: 'title', media: 'mainImage'},
},
})