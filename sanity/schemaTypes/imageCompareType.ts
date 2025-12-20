// sanity/schemaTypes/imageCompareType.ts
import { defineType, defineField, Rule } from 'sanity';
import { Image } from '@sanity/types';

export default defineType({
    name: 'imageCompare',
    title: 'Image Comparison',
    type: 'object',
    fields: [
        defineField({
            name: 'image1',
            title: 'Image 1 (Before)',
            type: 'image',
            options: { hotspot: true },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'image2',
            title: 'Image 2 (After)',
            type: 'image',
            options: { hotspot: true },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'size',
            title: 'Display Size',
            type: 'string',
            options: {
                list: [
                    { title: 'Small', value: 'small' },
                    { title: 'Medium', value: 'medium' },
                    { title: 'Large', value: 'large' },
                ],
                layout: 'radio',
            },
            initialValue: 'large',
        }),
    ],
    preview: {
        select: {
            media: 'image1',
            media2: 'image2',
        },
        prepare({ media, media2 }: { media?: Image, media2?: Image }) {
            return {
                title: 'Image Comparison',
                media: media || media2,
            };
        },
    },
});





