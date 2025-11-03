// components/PortableTextComponent.tsx
'use client'

import React from 'react'
import { PortableText, PortableTextComponents, PortableTextComponentProps } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import dynamic from 'next/dynamic' // <-- IMPORT DYNAMIC
import { slugify } from 'transliteration';
import NextImage from 'next/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import type { PortableTextBlock } from '@portabletext/types';

// --- LAZY-LOADED COMPONENTS ---
const LoadingSpinner = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}><div className="spinner" /></div>;

const ImageCompare = dynamic(() => import('./ImageCompare'), {
    loading: () => <LoadingSpinner />,
    ssr: false
});
const TwoImageGrid = dynamic(() => import('./custom/TwoImageGrid'), {
    loading: () => <LoadingSpinner />,
});
const FourImageGrid = dynamic(() => import('./custom/FourImageGrid'), {
    loading: () => <LoadingSpinner />,
});
// --- END LAZY-LOADED COMPONENTS ---


const SanityImageComponent = ({ value }: { value: any }) => {
    const { asset, alt } = value;
    const openLightbox = useLightboxStore((state) => state.openLightbox);
    if (!asset?._id || !asset?.url) return null;

    const { width, height } = asset.metadata?.dimensions || { width: 1920, height: 1080 };
    const blurDataURL = asset.metadata?.lqip;

    const optimizedSrc = urlFor(asset)
        .width(1920)
        .auto('format')
        .url();

    const fullResSrc = urlFor(asset).auto('format').url();

    return (
        <div style={{ margin: '4rem 0' }}>
            <div
              onClick={() => openLightbox([fullResSrc], 0)}
              className="image-lightbox-trigger"
            >
                <NextImage
                    src={optimizedSrc}
                    alt={alt || 'Content Image'}
                    width={width}
                    height={height}
                    sizes="(max-width: 960px) 90vw, 850px"
                    placeholder={blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={blurDataURL}
                    loading="lazy"
                    draggable={false}
                    style={{
                        width: '100%',
                        height: 'auto',
                    }}
                />
            </div>
        </div>
    );
};

const H2Component = ({ children }: { children?: React.ReactNode }) => {
    const textContent = Array.isArray(children) ? children.join('') : (children as string) || '';
    const id = slugify(textContent);
    return <h2 id={id} style={{ margin: '5rem 0 2rem 0', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>{children}</h2>
}

const BlockquoteComponent = (props: PortableTextComponentProps<PortableTextBlock>) => {
    return <blockquote style={{ margin: '4rem 0', paddingLeft: '2rem', borderLeft: '4px solid var(--accent)', fontSize: '2.4rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>{props.children}</blockquote>;
}

const components: PortableTextComponents = {
    types: { 
        image: SanityImageComponent,
        imageCompare: ({ value }) => <ImageCompare value={value} />,
        twoImageGrid: ({ value }) => <TwoImageGrid value={value} />,
        fourImageGrid: ({ value }) => <FourImageGrid value={value} />,
    },
    block: { h2: H2Component, blockquote: BlockquoteComponent },
}

export default function PortableTextComponent({ content }: { content: any[] }) {
    if (!content) return null
    return (
        <div className="portable-text-content" style={{ fontSize: '1.8rem', lineHeight: 1.8 }}>
            <PortableText value={content} components={components} />
        </div>
    )
}


