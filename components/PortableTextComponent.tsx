// components/PortableTextComponent.tsx
'use client'

import React, {useEffect, useState, useMemo} from 'react'
import {
  PortableText,
  PortableTextComponents,
  PortableTextComponentProps,
  PortableTextMarkComponentProps,
} from '@portabletext/react'
import {urlFor} from '@/sanity/lib/image'
import dynamic from 'next/dynamic'
import {slugify} from 'transliteration'
import NextImage from 'next/image'
import {useLightboxStore} from '@/lib/lightboxStore'
import type {PortableTextBlock} from '@portabletext/types'
import {useTheme} from 'next-themes'
import {sanityLoader} from '@/lib/sanity.loader'

// --- LAZY-LOADED COMPONENTS ---
const LoadingSpinner = () => (
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
    <div className="spinner" />
  </div>
)

const ImageCompare = dynamic(() => import('./ImageCompare'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})
const TwoImageGrid = dynamic(() => import('./custom/TwoImageGrid'), {
  loading: () => <LoadingSpinner />,
})
const FourImageGrid = dynamic(() => import('./custom/FourImageGrid'), {
  loading: () => <LoadingSpinner />,
})
const SanityTable = dynamic(() => import('./custom/SanityTable'), {
  loading: () => <LoadingSpinner />,
})
const GameDetails = dynamic(() => import('./content/GameDetails'), {
  loading: () => <LoadingSpinner />,
})
const YoutubeEmbed = dynamic(() => import('./content/YoutubeEmbed'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})
// --- END LAZY-LOADED COMPONENTS ---

type ColorMapping = {
  word: string
  color: string
}

// Match English words (Latin characters)
const ENGLISH_REGEX = /(\b[a-zA-Z]+(?:['’][a-zA-Z]+)?\b)/g

const shouldIgnoreColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return true

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return true

  const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b))
  const isGrayscale = maxDiff < 20 

  if (isGrayscale) {
    if (r < 80 || r > 180) {
      return true 
    }
  }

  return false 
}

const ColorMark = ({
  value,
  children,
}: PortableTextMarkComponentProps<{_type: 'color'; hex: string}>) => {
  const {resolvedTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const originalColor = value?.hex

  if (!mounted || !originalColor) {
    return <span style={{color: originalColor, fontWeight: '700'}}>{children}</span>
  }

  if (shouldIgnoreColor(originalColor)) {
    return <span style={{fontWeight: '700'}}>{children}</span>
  }

  let finalColor = originalColor

  const getLuminance = (hex: string): number => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return 0
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const luminance = getLuminance(finalColor)

  if (resolvedTheme === 'dark' && luminance < 60) {
    finalColor = `color-mix(in srgb, ${finalColor} 30%, white 70%)`
  } else if (resolvedTheme === 'light' && luminance > 200) {
    finalColor = `color-mix(in srgb, ${finalColor} 70%, black 30%)`
  }

  return <span style={{color: finalColor, fontWeight: '700'}}>{children}</span>
}

const SanityImageComponent = ({value}: {value: any}) => {
  const {asset, alt} = value
  const openLightbox = useLightboxStore((state) => state.openLightbox)
  if (!asset?._id || !asset?.url) return null

  const {width, height} = asset.metadata?.dimensions || {width: 1920, height: 1080}
  const blurDataURL = asset.metadata?.lqip

  const optimizedSrc = urlFor(asset).width(1920).auto('format').url()
  const fullResSrc = urlFor(asset).auto('format').url()

  return (
    <figure style={{ margin: '4rem 0', display: 'block' }}>
      <div 
        onClick={() => openLightbox([fullResSrc], 0)} 
        className="image-lightbox-trigger"
        role="button"
        aria-label="View full size image"
      >
        <NextImage
          loader={sanityLoader}
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
      {alt && (
        <figcaption style={{ 
            textAlign: 'center', 
            color: 'var(--text-secondary)', 
            fontSize: '1.4rem', 
            marginTop: '1rem',
            fontStyle: 'italic'
        }}>
            {alt}
        </figcaption>
      )}
    </figure>
  )
}

const HeadingComponent = ({level, children}: {level: number; children?: React.ReactNode}) => {
  const textContent = Array.isArray(children) ? children.join('') : (children as string) || ''
  const id = slugify(textContent)

  const styles: Record<number, React.CSSProperties> = {
    1: {
      fontSize: '3.6rem',
      margin: '5rem 0 2rem 0',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-color)',
    },
    2: {
      fontSize: '2.8rem',
      margin: '5rem 0 2rem 0',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-color)',
    },
    3: {fontSize: '2.2rem', margin: '4rem 0 1.5rem 0'},
  }

  return React.createElement(`h${level}`, {id, style: styles[level] || styles[2]}, children)
}

const BlockquoteComponent = (props: PortableTextComponentProps<PortableTextBlock>) => {
  return (
    <blockquote
      style={{
        margin: '4rem 0',
        paddingRight: '2rem',
        borderRight: '4px solid var(--accent)',
        fontSize: '2.4rem',
        fontStyle: 'italic',
        color: 'var(--text-primary)',
      }}
    >
      {props.children}
    </blockquote>
  )
}

export default function PortableTextComponent({
  content,
  colorDictionary, 
}: {
  content: any[]
  colorDictionary?: ColorMapping[]
}) {
  if (!content) return null

  const safeColorDictionary = Array.isArray(colorDictionary) ? colorDictionary : [];

  const components: PortableTextComponents = useMemo(() => {
    const colorMap = new Map(safeColorDictionary.map((item) => [item.word.toLowerCase(), item.color]))
    const colorRegex =
      safeColorDictionary.length > 0
        ? new RegExp(
            `\\b(${safeColorDictionary
              .map((item) => item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              .join('|')})\\b`,
            'gi',
          )
        : null

    const processTextForEnglish = (text: string) => {
      const parts = text.split(ENGLISH_REGEX)
      return parts.map((part, i) => {
        if (ENGLISH_REGEX.test(part)) {
          if (/[a-zA-Z]/.test(part)) {
             return <strong key={`eng-${i}`} style={{ fontWeight: '700' }}>{part}</strong>
          }
        }
        return part
      })
    }

    const NormalBlockRenderer = (props: PortableTextComponentProps<PortableTextBlock>) => {
      return (
        <p>
          {React.Children.map(props.children, (child: any) => {
            if (typeof child !== 'string') {
              return child
            }

            if (colorRegex) {
              const parts = child.split(colorRegex)
              return parts.map((part, i) => {
                const lowerPart = part.toLowerCase()
                if (colorMap.has(lowerPart)) {
                  return (
                    <span key={i} style={{color: colorMap.get(lowerPart), fontWeight: '700'}}>
                      {part}
                    </span>
                  )
                }
                return <React.Fragment key={i}>{processTextForEnglish(part)}</React.Fragment>
              })
            }

            return processTextForEnglish(child)
          })}
        </p>
      )
    }

    return {
      types: {
        image: SanityImageComponent,
        imageCompare: ({value}) => <ImageCompare value={value} />,
        twoImageGrid: ({value}) => <TwoImageGrid value={value} />,
        fourImageGrid: ({value}) => <FourImageGrid value={value} />,
        table: ({value}) => <SanityTable value={value} />,
        gameDetails: ({value}) => <GameDetails details={value.details} />,
        youtube: ({value}) => <YoutubeEmbed value={value} />,
      },
      block: {
        h1: ({children}) => <HeadingComponent level={1}>{children}</HeadingComponent>,
        h2: ({children}) => <HeadingComponent level={2}>{children}</HeadingComponent>,
        h3: ({children}) => <HeadingComponent level={3}>{children}</HeadingComponent>,
        blockquote: BlockquoteComponent,
        normal: NormalBlockRenderer,
      },
      marks: {
        color: ColorMark,
        link: ({value, children}) => {
          const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
          const isExternal = rel === 'noreferrer noopener'
          return (
            <a href={value.href} rel={rel} target={isExternal ? '_blank' : '_self'}>
              {children}
            </a>
          )
        },
      },
    }
  }, [safeColorDictionary])

  return (
    <div className="portable-text-content" style={{fontSize: '1.8rem', lineHeight: 1.8}}>
      <PortableText value={content} components={components} />
    </div>
  )
}