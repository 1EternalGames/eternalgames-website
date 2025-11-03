// sanity/schemaTypes/fourImageGridType.ts
import { defineType, defineField } from 'sanity';
import { Image } from '@sanity/types';

export default defineType({
    name: 'fourImageGrid',
    title: 'Four Image Grid',
    type: 'object',
    fields: [
        defineField({ name: 'image1', title: 'Image 1', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'image2', title: 'Image 2', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'image3', title: 'Image 3', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'image4', title: 'Image 4', type: 'image', options: { hotspot: true } }),
    ],
    preview: {
        select: { media: 'image1' },
        prepare({ media }: { media: Image }) {
            return { title: 'Four Image Grid', media };
        },
    },
});


