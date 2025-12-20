// lib/sanity.loader.ts

interface SanityImageLoaderProps {
  src: string
  width: number
  quality?: number
}

export const sanityLoader = ({ src, width, quality }: SanityImageLoaderProps) => {
  try {

    const url = new URL(src, 'http://dummy-base.com')

    if (url.origin !== 'https://cdn.sanity.io') {

      const separator = src.includes('?') ? '&' : '?'
      return `${src}${separator}width=${width}`
    }

    const originalW = url.searchParams.get('w')
    const originalH = url.searchParams.get('h')

    url.searchParams.set('w', width.toString())
    
    if (quality) {
      url.searchParams.set('q', quality.toString())
    } else {
      url.searchParams.delete('q')
    }

    if (originalW && originalH) {
       const aspectRatio = parseInt(originalH, 10) / parseInt(originalW, 10)
       if (!isNaN(aspectRatio)) {
         const newHeight = Math.round(width * aspectRatio)
         url.searchParams.set('h', newHeight.toString())
       }
    }

    url.searchParams.set('auto', 'format')

    return url.href
  } catch (e) {
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}width=${width}`
  }
}


