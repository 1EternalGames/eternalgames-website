// sanity/schemaTypes/gameReleaseType.ts

import {defineField, defineType, Rule} from 'sanity'

export default defineType({
name: 'gameRelease',
title: 'Game Release',
type: 'document',
fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'game', title: 'Game', type: 'reference', to: {type: 'game'}, validation: (Rule) => Rule.required()}),
    
    // Pinning and Trailer
    defineField({
        name: 'isPinned', 
        title: 'Pin to Top', 
        type: 'boolean', 
        initialValue: false
    }),
    defineField({
        name: 'trailer',
        title: 'Trailer URL (YouTube)',
        type: 'url'
    }),

    // DATE & TBA
    defineField({name: 'releaseDate', title: 'Release Date', type: 'date'}),
    defineField({name: 'isTBA', title: 'Is TBA?', type: 'boolean', initialValue: false}),

    // METADATA
    defineField({name: 'price', title: 'Price (e.g. $69.99)', type: 'string'}), 
    
    defineField({
        name: 'developer', 
        title: 'Developer', 
        type: 'reference', 
        to: [{type: 'developer'}]
    }),
    defineField({
        name: 'publisher', 
        title: 'Publisher', 
        type: 'reference', 
        to: [{type: 'publisher'}]
    }),

    defineField({name: 'platforms', title: 'Platforms', type: 'array', of: [{type: 'string'}], options: {list: ['PC', 'PlayStation', 'Xbox', 'Switch']}}),
    
    // NEW SUBSCRIPTION FIELDS
    defineField({name: 'onGamePass', title: 'On Game Pass?', type: 'boolean', initialValue: false}),
    defineField({name: 'onPSPlus', title: 'On PS Plus?', type: 'boolean', initialValue: false}),

    defineField({name: 'mainImage', title: 'Main Image', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required()}),
    defineField({name: 'synopsis', title: 'Synopsis', type: 'text', validation: (Rule) => Rule.required()}),
    defineField({name: 'tags', title: 'Tags (Genres)', type: 'array', of: [{type: 'reference', to: {type: 'tag'}, options: { filter: 'category == "Game"' }}]}),
    defineField({name: 'designers', title: 'Designers (Optional)', type: 'array', of: [{type: 'reference', to: {type: 'designer'}}]}),
    defineField({name: 'legacyId', title: 'Legacy ID', type: 'number', readOnly: true}),
],
preview: {
select: {title: 'title', subtitle: 'releaseDate', media: 'mainImage'},
},
})