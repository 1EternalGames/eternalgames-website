// components/content/YoutubeEmbed.tsx
'use client'

import React from 'react'

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default function YoutubeEmbed({value}: {value: {url: string}}) {
  const {url} = value
  if (!url) {
    return null
  }
  const id = getYouTubeId(url)
  if (!id) {
    return (
      <div style={{margin: '2rem 0', color: '#DC2626'}}>
        Invalid YouTube URL provided.
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        maxWidth: '100%',
        background: '#000',
        margin: '4rem 0',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '12px',
        }}
      />
    </div>
  )
}


