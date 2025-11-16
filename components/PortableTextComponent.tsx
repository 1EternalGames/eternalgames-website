// components/PortableTextComponent.tsx
'use client'

import React from 'react'
import { PortableText, PortableTextComponents, PortableTextComponentProps } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import dynamic from 'next/dynamic'
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
const SanityTable = dynamic(() => import('./custom/SanityTable'), {
    loading: () => <LoadingSpinner />,
});
const GameDetails = dynamic(() => import('./content/GameDetails'), {
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

const HeadingComponent = ({ level, children }: { level: number, children?: React.ReactNode }) => {
    const textContent = Array.isArray(children) ? children.join('') : (children as string) || '';
    const id = slugify(textContent);
    
    const styles: Record<number, React.CSSProperties> = {
        1: { fontSize: '3.6rem', margin: '5rem 0 2rem 0', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' },
        2: { fontSize: '2.8rem', margin: '5rem 0 2rem 0', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' },
        3: { fontSize: '2.2rem', margin: '4rem 0 1.5rem 0' }
    };
    
    return React.createElement(`h${level}`, { id, style: styles[level] || styles[2] }, children);
}

const BlockquoteComponent = (props: PortableTextComponentProps<PortableTextBlock>) => {
    return <blockquote style={{ margin: '4rem 0', paddingRight: '2rem', borderRight: '4px solid var(--accent)', fontSize: '2.4rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>{props.children}</blockquote>;
}

const components: PortableTextComponents = {
    types: { 
        image: SanityImageComponent,
        imageCompare: ({ value }) => <ImageCompare value={value} />,
        twoImageGrid: ({ value }) => <TwoImageGrid value={value} />,
        fourImageGrid: ({ value }) => <FourImageGrid value={value} />,
        table: ({ value }) => <SanityTable value={value} />,
        gameDetails: ({ value }) => <GameDetails details={value.details} width={value.width} />, // NEW
    },
    block: { 
        h1: ({children}) => <HeadingComponent level={1}>{children}</HeadingComponent>,
        h2: ({children}) => <HeadingComponent level={2}>{children}</HeadingComponent>,
        h3: ({children}) => <HeadingComponent level={3}>{children}</HeadingComponent>,
        blockquote: BlockquoteComponent 
    },
    marks: {
        color: ({ value, children }) => {
            return <span style={{ color: value?.hex }}>{children}</span>;
        },
    },
}

export default function PortableTextComponent({ content }: { content: any[] }) {
    if (!content) return null
    return (
        <div className="portable-text-content" style={{ fontSize: '1.8rem', lineHeight: 1.8 }}>
            <PortableText value={content} components={components} />
        </div>
    )
}