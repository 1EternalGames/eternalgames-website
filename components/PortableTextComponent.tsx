// components/PortableTextComponent.tsx
'use client'

import React from 'react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import ImageCompare from './ImageCompare';
import TwoImageGrid from './custom/TwoImageGrid';
import FourImageGrid from './custom/FourImageGrid';
import { slugify } from 'transliteration';
import NextImage from 'next/image'; // Import the Next.js Image component

const SanityImageComponent = ({ value }: { value: any }) => {
    const { asset, alt } = value;
    if (!asset?._id) return null;

    const { width, height } = asset.metadata?.dimensions || { width: 1920, height: 1080 };
    const blurDataURL = asset.metadata?.lqip;

    // --- THE DEFINITIVE FIX ---
    // Instead of passing the raw, full-size image URL to Next.js, we first ask Sanity
    // for a reasonably large, web-optimized version (max 1920px wide).
    // Next.js's optimizer will then use THIS pre-resized image as its source,
    // which is much faster to process and avoids timeouts.
    const optimizedSrc = urlFor(asset)
        .width(1920) // Limit the source image size to a reasonable maximum
        .auto('format')
        .quality(85)
        .url();

    return (
        <div style={{ margin: '4rem 0', borderRadius: '8px', overflow: 'hidden' }}>
            <NextImage
                src={optimizedSrc}
                alt={alt || 'Content Image'}
                width={width}
                height={height}
                sizes="(max-width: 960px) 90vw, 850px"
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                loading="lazy"
                style={{
                    width: '100%',
                    height: 'auto',
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