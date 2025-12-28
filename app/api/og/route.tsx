// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

export const runtime = 'edge';

// Fetch title, image, score, and category
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

    if (!slug) return new Response("Missing slug", { status: 400 });

    const data = await client.fetch(query, { slug });
    if (!data || !data.imageUrl) return new Response("Content not found", { status: 404 });

    // --- DESIGN CONSTANTS ---
    const ACCENT = '#00FFF0'; // Cyan
    const BG_DARK = '#0A0B0F'; 
    const CARD_BG = '#14161D'; 

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    backgroundColor: BG_DARK,
                    position: 'relative',
                    fontFamily: 'sans-serif', // Fallback to robust system font
                    padding: '40px', 
                }}
            >
                {/* THE CARD CONTAINER */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: `4px solid ${ACCENT}`, // Thicker border for visibility
                        boxShadow: `0 0 60px ${ACCENT}40`, 
                        backgroundColor: CARD_BG,
                    }}
                >
                    {/* BACKGROUND IMAGE (Full Cover) */}
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

                    {/* GRADIENT OVERLAY (Bottom Up for text contrast) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '85%',
                            background: 'linear-gradient(to top, #0A0B0F 15%, rgba(10,11,15,0.8) 55%, transparent 100%)',
                        }}
                    />

                    {/* CONTENT LAYER */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '50px',
                    }}>
                        
                        {/* SCORE BADGE (Top Right - Floating) */}
                        {data.score && (
                            <div style={{
                                position: 'absolute',
                                top: '40px',
                                right: '40px',
                                width: '140px',
                                height: '140px',
                                borderRadius: '50%',
                                backgroundColor: BG_DARK,
                                border: `5px solid ${ACCENT}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 10px 40px rgba(0,0,0,0.6)`,
                            }}>
                                <div style={{
                                    color: ACCENT,
                                    fontSize: '72px',
                                    fontWeight: 900,
                                    lineHeight: '1',
                                    marginTop: '-10px',
                                }}>
                                    {data.score}
                                </div>
                            </div>
                        )}

                        {/* CATEGORY PILL */}
                        <div style={{ display: 'flex', marginBottom: '25px' }}>
                            <div style={{
                                backgroundColor: 'rgba(0, 255, 240, 0.15)',
                                border: `2px solid ${ACCENT}`,
                                borderRadius: '50px',
                                padding: '10px 30px',
                                color: ACCENT,
                                fontSize: '24px',
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                            }}>
                                {data._type === 'review' ? 'REVIEW' : (data._type === 'news' ? 'NEWS' : 'ARTICLE')}
                            </div>
                        </div>

                        {/* TITLE */}
                        <div style={{
                            fontSize: '70px',
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: '1.1',
                            textShadow: '0 4px 15px rgba(0,0,0,0.9)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            marginBottom: '20px',
                            maxWidth: '90%',
                        }}>
                            {data.title}
                        </div>

                        {/* BRAND FOOTER */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '10px',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '6px',
                                backgroundColor: ACCENT,
                                borderRadius: '3px',
                            }} />
                            <div style={{
                                color: '#CCCCCC',
                                fontSize: '28px',
                                fontWeight: 600,
                                letterSpacing: '2px',
                            }}>
                                ETERNALGAMES.COM
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            // Removed 'fonts' option completely to force system font usage
        }
    );
  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed: ${e.message}`, { status: 500 });
  }
}