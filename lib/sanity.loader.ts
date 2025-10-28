// lib/sanity.loader.ts
'use client'

interface SanityImageLoaderProps {
  src: string
  width: number
  quality?: number
}

export const sanityLoader = ({ src, width, quality }: SanityImageLoaderProps) => {
  const url = new URL(src)
  if (url.hostname !== 'cdn.sanity.io') {
    return src
  }
  
  const params = url.searchParams

  params.set('auto', 'format')
  params.set('w', width.toString())
  
  // THE DEFINITIVE FIX: The 'q' parameter is permanently removed.
  params.delete('q');

  return `${url.origin}${url.pathname}?${params.toString()}`
}