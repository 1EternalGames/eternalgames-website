// sanity/schemaTypes/twoImageGridType.ts
import { defineType, defineField } from 'sanity';
import { Image } from '@sanity/types';

export default defineType({
    name: 'twoImageGrid',
    title: 'Two Image Grid',
    type: 'object',
    fields: [
        defineField({
            name: 'image1',
            title: 'Image 1',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'image2',
            title: 'Image 2',
            type: 'image',
            options: { hotspot: true },
        }),
    ],
    preview: {
        select: {
            media: 'image1',
            media2: 'image2',
        },
        prepare({ media, media2 }: { media?: Image, media2?: Image }) {
            return {
                title: 'Two Image Grid',
                media: media || media2,
            };
        },
    },
});


