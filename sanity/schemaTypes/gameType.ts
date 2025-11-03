import {defineField, defineType, Rule} from 'sanity'

export default defineType({
name: 'game',
title: 'Game',
type: 'document',
fields: [
defineField({
name: 'title',
title: 'Title',
type: 'string',
validation: (Rule) => Rule.required(),
}),
defineField({
name: 'slug',
title: 'Slug',
type: 'slug',
options: {
source: 'title',
maxLength: 96,
},
validation: (Rule) => Rule.required(),
}),
defineField({
name: 'mainImage',
title: 'Main Image',
type: 'image',
options: {
hotspot: true,
},
}),
],
})


