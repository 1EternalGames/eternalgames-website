// components/PortableTextComponent.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { PortableText, PortableTextComponents, PortableTextComponentProps, PortableTextMarkComponentProps } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import dynamic from 'next/dynamic'
import { slugify } from 'transliteration';
import NextImage from 'next/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import type { PortableTextBlock } from '@portabletext/types';
import { useTheme } from 'next-themes';

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

// --- REPLICATED COLOR PALETTE FROM EDITOR ---
const COLOR_PALETTE = [
    { title: 'Grays', colors: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937'] },
    { title: 'Reds', colors: ['#FEF2F2', '#FEE2E2', '#FECACA', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'] },
    { title: 'Oranges', colors: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412', '#7C2D12', '#431407'] },
    { title: 'Yellows', colors: ['#FEFCE8', '#FEF9C3', '#FEF08A', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E', '#713F12', '#422006'] },
    { title: 'Greens', colors: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D', '#052e16'] },
    { title: 'Cyans', colors: ['#ECFEFF', '#CFFAFE', '#A5F3FC', '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63', '#083344'] },
    { title: 'Blues', colors: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554'] },
    { title: 'Purples', colors: ['#F5F3FF', '#EDE9FE', '#DDD6FE', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#2E1065'] },
];

// --- NEW THEME-AWARE COLOR COMPONENT ---
const ColorMark = ({ value, children }: PortableTextMarkComponentProps<{ _type: 'color'; hex: string }>) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const originalColor = value?.hex;

    if (!mounted || !originalColor) {
        return <span style={{ color: originalColor }}>{children}</span>;
    }
    
    let colorInfo: { palette: (typeof COLOR_PALETTE)[0]; grade: number } | null = null;
    for (const palette of COLOR_PALETTE) {
        const gradeIndex = palette.colors.findIndex(c => c.toLowerCase() === originalColor.toLowerCase());
        if (gradeIndex !== -1) {
            colorInfo = { palette, grade: gradeIndex + 1 }; // Grade is 1-10
            break;
        }
    }

    // If the color isn't from our predefined palette (e.g., custom hex), don't change it.
    if (!colorInfo) {
        return <span style={{ color: originalColor }}>{children}</span>;
    }
    
    let finalColor = originalColor;
    const { palette, grade } = colorInfo;

    // Special case for the Grayscale palette
    if (palette.title === 'Grays') {
        const oppositeGrade = 11 - grade; // e.g., 1 -> 10, 10 -> 1
        if (resolvedTheme === 'dark' && grade > 5) { // Dark gray on dark bg
             finalColor = palette.colors[oppositeGrade - 1];
        } else if (resolvedTheme === 'light' && grade < 6) { // Light gray on light bg
             finalColor = palette.colors[oppositeGrade - 1];
        }
    } 
    // Rules for all other color palettes
    else {
        if (resolvedTheme === 'light' && grade >= 1 && grade <= 4) {
            // Very light color on light background, shift to grade 5 (mid-dark)
            finalColor = palette.colors[4]; 
        } else if (resolvedTheme === 'dark' && grade >= 7 && grade <= 10) {
            // Very dark color on dark background, shift to grade 6 (mid-light)
            finalColor = palette.colors[5]; 
        }
    }

    return <span style={{ color: finalColor }}>{children}</span>;
};


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
        gameDetails: ({ value }) => <GameDetails details={value.details} />,
    },
    block: { 
        h1: ({children}) => <HeadingComponent level={1}>{children}</HeadingComponent>,
        h2: ({children}) => <HeadingComponent level={2}>{children}</HeadingComponent>,
        h3: ({children}) => <HeadingComponent level={3}>{children}</HeadingComponent>,
        blockquote: BlockquoteComponent 
    },
    marks: {
        color: ColorMark,
        link: ({ value, children }) => {
            const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
            const isExternal = rel === 'noreferrer noopener';
            return (
                <a href={value.href} rel={rel} target={isExternal ? "_blank" : "_self"}>
                    {children}
                </a>
            );
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