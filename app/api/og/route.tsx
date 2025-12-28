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

    // 1. Fetch "Inter" Font (Robust CDN link)
    // We use a try/catch for the font specifically so the image still generates even if the font fails.
    let fontData: ArrayBuffer | null = null;
    try {
        const fontResponse = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf');
        if (fontResponse.ok) {
            fontData = await fontResponse.arrayBuffer();
        }
    } catch (e) {
        console.warn("Font fetch failed, falling back to system font");
    }

    if (!slug) return new Response("Missing slug", { status: 400 });

    const data = await client.fetch(query, { slug });

    if (!data || !data.imageUrl) return new Response("Content not found", { status: 404 });

    // Design Configuration
    const accentColor = '#00FFF0'; // Cyan
    const darkBg = '#050505';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: darkBg,
                    position: 'relative',
                    fontFamily: '"Inter", sans-serif', // Use Inter if loaded
                }}
            >
                 {/* 1. Background Image */}
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
                
                {/* 2. Overlays */}
                {/* Dark Vignette for text readability */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.4) 30%, transparent 60%)',
                    }}
                />
                
                {/* Cyber Border Inset */}
                <div 
                    style={{
                        position: 'absolute',
                        top: '20px', left: '20px', right: '20px', bottom: '20px',
                        border: `2px solid ${accentColor}`,
                        borderRadius: '20px',
                        opacity: 0.8,
                        boxShadow: `0 0 40px ${accentColor}40`, // Soft glow
                        zIndex: 5
                    }}
                />

                {/* 3. Top Section: Score */}
                <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: '40px',
                    display: 'flex',
                    zIndex: 10
                }}>
                    {data.score && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '140px',
                            height: '140px',
                            backgroundColor: accentColor,
                            borderRadius: '50%',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            border: '8px solid rgba(0,0,0,0.2)',
                        }}>
                            <span style={{
                                color: '#000',
                                fontSize: '80px',
                                fontWeight: 900,
                                lineHeight: '1',
                                marginTop: '-5px', // Visual centering
                            }}>
                                {data.score}
                            </span>
                        </div>
                    )}
                </div>

                {/* 4. Bottom Section: Logo & Category */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50px',
                    right: '50px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    zIndex: 10,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{
                            color: accentColor,
                            fontSize: '24px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            background: 'rgba(0, 255, 240, 0.1)',
                            padding: '10px 20px',
                            borderRadius: '50px',
                            border: `1px solid ${accentColor}60`,
                            width: 'fit-content'
                        }}>
                             {data._type === 'review' ? 'REVIEW' : (data.category || 'ARTICLE')}
                        </div>
                        <div style={{
                            color: '#FFF',
                            fontSize: '60px',
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                        }}>
                            ETERNALGAMES
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            // Only attach fonts if fetch succeeded
            fonts: fontData ? [
                {
                    name: 'Inter',
                    data: fontData,
                    style: 'normal',
                    weight: 900,
                },
            ] : undefined,
        }
    );
  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}