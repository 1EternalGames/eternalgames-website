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

    // 1. Robust Font Fetching (Inter - Black/Bold)
    // We use a high-availability CDN. If this fails, it falls back gracefully.
    const fontBold = await fetch(
        new URL('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer()).catch(() => null);

    const fontRegular = await fetch(
        new URL('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer()).catch(() => null);

    if (!slug) return new Response("Missing slug", { status: 400 });

    const data = await client.fetch(query, { slug });
    if (!data || !data.imageUrl) return new Response("Content not found", { status: 404 });

    // --- DESIGN CONSTANTS (MATCHING YOUR SITE) ---
    const ACCENT = '#00FFF0'; // The EternalGames Cyan
    const BG_DARK = '#0A0B0F'; // Your bg-primary
    const CARD_BG = '#14161D'; // Your bg-secondary

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    backgroundColor: BG_DARK,
                    position: 'relative',
                    fontFamily: '"Inter", sans-serif',
                    padding: '40px', // Outer spacing
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
                        border: `2px solid ${ACCENT}`, // The Cyber Border
                        boxShadow: `0 0 40px ${ACCENT}40`, // Soft Glow
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

                    {/* GRADIENT OVERLAY (Bottom Up) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '80%',
                            background: 'linear-gradient(to top, #0A0B0F 10%, rgba(10,11,15,0.8) 50%, transparent 100%)',
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
                        padding: '40px',
                    }}>
                        
                        {/* SCORE BADGE (Top Right - Floating) */}
                        {data.score && (
                            <div style={{
                                position: 'absolute',
                                top: '30px',
                                right: '30px',
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: BG_DARK, // Dark background
                                border: `4px solid ${ACCENT}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
                            }}>
                                <div style={{
                                    color: ACCENT,
                                    fontSize: '64px',
                                    fontWeight: 900,
                                    lineHeight: '1',
                                    marginTop: '-5px',
                                }}>
                                    {data.score}
                                </div>
                            </div>
                        )}

                        {/* CATEGORY PILL */}
                        <div style={{
                            display: 'flex',
                            marginBottom: '20px',
                        }}>
                            <div style={{
                                backgroundColor: `${ACCENT}20`, // 20% opacity cyan
                                border: `1px solid ${ACCENT}`,
                                borderRadius: '50px',
                                padding: '8px 24px',
                                color: ACCENT,
                                fontSize: '20px',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                            }}>
                                {data._type === 'review' ? 'REVIEW' : (data._type === 'news' ? 'NEWS' : 'ARTICLE')}
                            </div>
                        </div>

                        {/* TITLE */}
                        <div style={{
                            fontSize: '64px',
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: '1.1',
                            textShadow: '0 4px 10px rgba(0,0,0,0.8)',
                            // Ensure long titles don't overflow
                            display: 'flex',
                            flexWrap: 'wrap',
                            marginBottom: '10px'
                        }}>
                            {data.title}
                        </div>

                        {/* BRAND FOOTER */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '10px',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '4px',
                                backgroundColor: ACCENT,
                                borderRadius: '2px',
                            }} />
                            <div style={{
                                color: '#AAA',
                                fontSize: '24px',
                                fontWeight: 500,
                                letterSpacing: '1px',
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
            fonts: fontBold && fontRegular ? [
                {
                    name: 'Inter',
                    data: fontBold,
                    style: 'normal',
                    weight: 900,
                },
                {
                    name: 'Inter',
                    data: fontRegular,
                    style: 'normal',
                    weight: 500,
                },
            ] : undefined,
        }
    );
  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed: ${e.message}`, { status: 500 });
  }
}