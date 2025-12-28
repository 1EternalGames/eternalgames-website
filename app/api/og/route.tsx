// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// We explicitly define these here to avoid importing the heavy sanity client/env files
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '0zany1dm';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const QUERY = `*[_type in ["review", "article", "news"] && slug.current == $slug][0]{
    title,
    "imageUrl": mainImage.asset->url,
    score,
    "category": category->title,
    _type
}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return new Response("Missing Slug Parameter", { status: 400 });
    }

    // 1. RAW FETCH (No Sanity Client Library)
    // This is lightweight and guaranteed to work in Edge Runtime
    const url = `https://${PROJECT_ID}.api.sanity.io/v2022-03-07/data/query/${DATASET}?query=${encodeURIComponent(QUERY)}&%24slug="${slug}"`;

    const sanityRes = await fetch(url);
    
    if (!sanityRes.ok) {
        throw new Error(`Sanity API Error: ${sanityRes.statusText}`);
    }

    const json = await sanityRes.json();
    const data = json.result;

    if (!data || !data.imageUrl) {
         // Fallback layout if no data found
         return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: 'white', fontSize: 60, fontWeight: 900, fontFamily: 'sans-serif' }}>
                    EternalGames
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }

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
                    fontFamily: 'sans-serif',
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
                        border: `4px solid ${ACCENT}`,
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

                    {/* GRADIENT OVERLAY */}
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
                        
                        {/* SCORE BADGE */}
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
        }
    );
  } catch (e: any) {
    // Return a JSON error so we can see it in the browser instead of a white screen
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
    });
  }
}