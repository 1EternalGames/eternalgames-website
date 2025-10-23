// components/PortableTextComponent.tsx
'use client'

import React from 'react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import ImageCompare from './ImageCompare';
import TwoImageGrid from './custom/TwoImageGrid';
import FourImageGrid from './custom/FourImageGrid';
import { slugify } from 'transliteration';

const generateSrcSet = (imageRef: any, sizes: number[]): string => {
    return sizes
        .map(width => `${urlFor(imageRef).width(width).auto('format').quality(85).url()} ${width}w`)
        .join(', ');
};

const SanityImageComponent = ({ value }: { value: any }) => {
    const blurDataURL = value.asset?.metadata?.lqip;
    const imageRef = value.asset?._ref;

    if (!imageRef) return null;

    const smallestSrc = urlFor(imageRef).width(800).auto('format').quality(85).url();
    const srcSet = generateSrcSet(imageRef, [800, 1280, 1920]);

    return (
        <div style={{ margin: '4rem 0', borderRadius: '8px', overflow: 'hidden' }}>
            <img
                src={smallestSrc}
                srcSet={srcSet}
                sizes="(max-width: 960px) 90vw, 850px"
                alt={value.alt || 'Content Image'}
                loading="lazy"
                style={{
                    width: '100%',
                    height: 'auto',
                    backgroundImage: `url(${blurDataURL})`,
                    backgroundSize: 'cover',
                }}
            />
        </div>
    );
};

const H2Component = ({ children }: { children: React.ReactNode }) => {
    const textContent = Array.isArray(children) ? children.join('') : (children as string) || '';
    const id = slugify(textContent);
    return <h2 id={id} style={{ margin: '5rem 0 2rem 0', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>{children}</h2>
}

const components: PortableTextComponents = {
    types: { 
        image: SanityImageComponent,
        imageCompare: ({ value }) => <ImageCompare value={value} />,
        twoImageGrid: ({ value }) => <TwoImageGrid value={value} />,
        fourImageGrid: ({ value }) => <FourImageGrid value={value} />,
    },
    block: { h2: H2Component, blockquote: ({ children }) => <blockquote style={{ margin: '4rem 0', paddingLeft: '2rem', borderLeft: '4px solid var(--accent)', fontSize: '2.4rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>{children}</blockquote>, },
}

export default function PortableTextComponent({ content }: { content: any[] }) {
    if (!content) return null
    return (
        <div className="portable-text-content" style={{ fontSize: '1.8rem', lineHeight: 1.8 }}>
            <PortableText value={content} components={components} />
        </div>
    )
}