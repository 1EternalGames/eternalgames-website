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

  const originalWidth = params.get('w');
  const originalHeight = params.get('h');

  // Set common params
  params.set('auto', 'format')
  params.set('w', width.toString())
  params.delete('q');

  if (originalWidth && originalHeight) {
    const aspectRatio = parseInt(originalHeight, 10) / parseInt(originalWidth, 10);
    const newHeight = Math.round(width * aspectRatio);
    params.set('h', newHeight.toString());
  }
  
  return `${url.origin}${url.pathname}?${params.toString()}`
}


