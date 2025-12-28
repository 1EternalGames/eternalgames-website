// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

export const runtime = 'edge';

const query = groq`
  *[_type in ["review", "article", "news"] && slug.current == $slug][0] {
    title,
    "imageUrl": mainImage.asset->url,
    score,
    "category": category->title,
    _type,
    "authorName": coalesce(authors[0]->name, reporters[0]->name, "EternalGames")
  }
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. Fetch the Cairo Font (Required for Arabic support)
  // We fetch the Bold weight (700) for titles
  const fontData = await fetch(
    new URL('https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  if (!slug) {
    return new ImageResponse(
      (
        <div style={{ background: '#050505', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 900, fontFamily: '"Cairo"' }}>
          EternalGames
        </div>
      ),
      { 
          width: 1200, 
          height: 630,
          fonts: [{ name: 'Cairo', data: fontData, style: 'normal', weight: 700 }]
      }
    );
  }

  const data = await client.fetch(query, { slug });

  if (!data) {
     return new ImageResponse(
      (
        <div style={{ background: '#050505', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 900, fontFamily: '"Cairo"' }}>
          EternalGames
        </div>
      ),
      { 
          width: 1200, 
          height: 630,
          fonts: [{ name: 'Cairo', data: fontData, style: 'normal', weight: 700 }]
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0B0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"Cairo"', // Use the loaded font
        }}
      >
        {data.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
            src={data.imageUrl}
            alt=""
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.6,
            }}
            />
        )}
        
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, #0A0B0F 15%, rgba(10,11,15,0.8) 50%, transparent 100%)',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '60px',
            width: '100%',
            height: '100%',
            direction: 'rtl', // Ensure RTL layout for Arabic
          }}
        >
            {/* Metadata Pill Row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '20px',
                }}
            >
                {data.score && (
                    <div
                        style={{
                            background: '#00FFF0',
                            color: '#000',
                            fontSize: '32px',
                            fontWeight: 900,
                            padding: '4px 16px',
                            borderRadius: '50px',
                        }}
                    >
                        {data.score}/10
                    </div>
                )}
                <div
                     style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: '#00FFF0',
                        fontSize: '24px',
                        fontWeight: 700,
                        padding: '8px 24px',
                        borderRadius: '50px',
                        border: '1px solid #00FFF0',
                        textTransform: 'uppercase',
                    }}
                >
                    {data._type === 'review' ? 'مراجعة' : (data.category || 'مقال')}
                </div>
                
                {/* Author Name Badge */}
                {data.authorName && (
                   <div style={{
                       color: '#cccccc',
                       fontSize: '24px',
                       fontWeight: 600,
                       marginLeft: 'auto' 
                   }}>
                       بقلم: {data.authorName}
                   </div>
                )}
            </div>

            {/* Title */}
            <h1
                style={{
                    fontSize: '72px',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1.1,
                    margin: 0,
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                    maxWidth: '95%',
                }}
            >
                {data.title}
            </h1>
            
            {/* Brand Watermark */}
            <div 
                style={{
                    position: 'absolute',
                    top: '60px',
                    left: '60px',
                    fontSize: '32px',
                    fontWeight: 900,
                    color: '#00FFF0',
                }}
            >
                EternalGames.
            </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // Load the Arabic-compatible font
      fonts: [
          {
              name: 'Cairo',
              data: fontData,
              style: 'normal',
              weight: 700
          }
      ]
    }
  );
}