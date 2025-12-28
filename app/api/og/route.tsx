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
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // 1. Fetch Font Safely (Using Direct Raw URL)
    const fontData = await fetch(
      'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo-Bold.ttf'
    ).then((res) => {
        if (!res.ok) throw new Error('Failed to load font file');
        return res.arrayBuffer();
    });

    if (!slug) {
        return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: 'white', fontSize: 60, fontWeight: 700, fontFamily: '"Cairo"' }}>
                    EternalGames
                </div>
            ),
            { width: 1200, height: 630, fonts: [{ name: 'Cairo', data: fontData, style: 'normal', weight: 700 }] }
        );
    }

    const data = await client.fetch(query, { slug });

    if (!data) {
        return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: 'white', fontSize: 60, fontWeight: 700, fontFamily: '"Cairo"' }}>
                    404: Content Not Found
                </div>
            ),
            { width: 1200, height: 630, fonts: [{ name: 'Cairo', data: fontData, style: 'normal', weight: 700 }] }
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
                    fontFamily: '"Cairo"',
                    position: 'relative',
                }}
            >
                 {/* Background Image */}
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
                        background: 'linear-gradient(to top, #0A0B0F 10%, transparent 100%)',
                    }}
                />

                {/* Content Container */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '60px',
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                    // Use flex-end alignment for RTL visual look in standard flex container
                    alignItems: 'flex-end', 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                        {data.score && (
                            <div style={{
                                backgroundColor: '#00FFF0',
                                color: '#000',
                                fontSize: '32px',
                                fontWeight: 700,
                                padding: '5px 20px',
                                borderRadius: '50px',
                            }}>
                                {data.score}/10
                            </div>
                        )}
                        <div style={{
                            color: '#00FFF0',
                            fontSize: '24px',
                            fontWeight: 700,
                            border: '2px solid #00FFF0',
                            padding: '5px 20px',
                            borderRadius: '50px',
                            background: 'rgba(0,0,0,0.5)'
                        }}>
                             {data._type === 'review' ? 'مراجعة' : (data.category || 'مقال')}
                        </div>
                    </div>

                    <div style={{
                        fontSize: '70px',
                        fontWeight: 700,
                        color: 'white',
                        lineHeight: 1.1,
                        textShadow: '0 4px 10px rgba(0,0,0,0.8)',
                        textAlign: 'right',
                        marginBottom: '20px',
                        maxWidth: '90%',
                    }}>
                        {data.title}
                    </div>
                </div>

                {/* Brand Logo (Top Left) */}
                <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    color: '#00FFF0',
                    fontSize: '32px',
                    fontWeight: 700,
                }}>
                    EternalGames.
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Cairo',
                    data: fontData,
                    style: 'normal',
                    weight: 700,
                },
            ],
        }
    );
  } catch (e: any) {
    // If generation fails, return a text response so we can see the error in the browser
    console.error('OG Generation Error:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}