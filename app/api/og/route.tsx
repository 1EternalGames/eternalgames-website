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
    _type
  }
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: 'white', fontSize: 60, fontWeight: 900, fontFamily: 'sans-serif' }}>
                    EternalGames
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }

    const data = await client.fetch(query, { slug });

    if (!data || !data.imageUrl) {
        return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: 'white', fontSize: 60, fontWeight: 900, fontFamily: 'sans-serif' }}>
                    EternalGames
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#0A0B0F',
                    position: 'relative',
                }}
            >
                 {/* Background Image - Full Cover */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    }}
                />
                
                {/* Subtle Gradient Overlay for Text Readability */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
                    }}
                />

                {/* Content Container */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '40px',
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                }}>
                    {/* Brand Logo (Bottom Left) */}
                    <div style={{
                        color: '#00FFF0',
                        fontSize: '40px',
                        fontWeight: 900,
                        fontFamily: 'sans-serif',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}>
                        EternalGames.
                    </div>

                    {/* Score Badge (Bottom Right) - Only if score exists */}
                    {data.score && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#00FFF0',
                            color: '#000',
                            fontSize: '48px',
                            fontWeight: 900,
                            padding: '10px 30px',
                            borderRadius: '50px',
                            fontFamily: 'sans-serif',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        }}>
                            {data.score}
                        </div>
                    )}
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            // No custom fonts = No fetch errors
        }
    );
  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}