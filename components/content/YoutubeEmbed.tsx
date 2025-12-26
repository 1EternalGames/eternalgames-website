// components/content/YoutubeEmbed.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function YoutubeEmbed({value}: {value: {url: string}}) {
  const [isLoaded, setIsLoaded] = useState(false) // <--- State to track interaction
  const {url} = value
  
  if (!url) return null
  const id = getYouTubeId(url)

  if (!id) return null

  // 1. If user clicked, load the heavy iframe (and base.js)
  if (isLoaded) {
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', margin: '4rem 0' }}>
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1`} // Auto-play since user already clicked
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      )
  }

  // 2. Otherwise, show a lightweight image placeholder
  const thumbnailUrl = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`

  return (
    <div 
      onClick={() => setIsLoaded(true)}
      style={{
        position: 'relative',
        paddingBottom: '56.25%', 
        height: 0,
        overflow: 'hidden',
        maxWidth: '100%',
        background: '#000',
        margin: '4rem 0',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        cursor: 'pointer'
      }}
    >
        <Image 
            src={thumbnailUrl} 
            alt="Video Thumbnail" 
            fill 
            style={{ objectFit: 'cover' }}
        />
        {/* Play Button Overlay */}
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '60px', height: '40px', background: '#FF0000', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
            <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid white' }} />
        </div>
    </div>
  )
}