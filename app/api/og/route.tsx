// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '0zany1dm';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const QUERY = `*[_type in ["review", "article", "news"] && slug.current == $slug][0]{
    "imageUrl": mainImage.asset->url,
    score
}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) return new Response("Missing Slug", { status: 400 });

    const url = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${encodeURIComponent(QUERY)}&%24slug="${slug}"`;
    const sanityRes = await fetch(url);
    
    if (!sanityRes.ok) throw new Error("Sanity Fetch Failed");
    
    const json = await sanityRes.json();
    const data = json.result;

    if (!data || !data.imageUrl) {
        return new ImageResponse(
            <div style={{ display: 'flex', width: '100%', height: '100%', background: '#050505' }} />,
            { width: 1200, height: 630 }
        );
    }

    // Force Sanity CDN to deliver Max Quality (100) at exact Dimensions
    const highResImage = `${data.imageUrl}?w=1200&h=630&fit=crop&q=100&auto=format`;

    const ACCENT = '#00FFF0';

    return new ImageResponse(
        (
            // 1. OUTER CONTAINER: Full square rectangle with dark background.
            // This ensures the "corners" outside the border radius are #0A0B0F, not white/transparent.
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0A0B0F', 
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* 2. INNER CONTAINER: Rounded and Clipped */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        borderRadius: '42px', // Visible rounding
                        overflow: 'hidden',   // Clips the image
                    }}
                >
                    {/* 1. Background Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={highResImage}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                    />

                    {/* 2. Gradient Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '60%',
                            display: 'flex',
                            background: 'linear-gradient(to top, #0A0B0F 0%, rgba(10,11,15,0.6) 40%, transparent 100%)',
                        }}
                    />

                    {/* 3. Cyber Border Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: `4px solid ${ACCENT}`,
                            borderRadius: '42px', // Match inner container radius
                            boxShadow: `inset 0 0 50px ${ACCENT}60`, 
                            display: 'flex', 
                        }}
                    />

                    {/* 4. Score Badge */}
                    {data.score && (
                        <div style={{
                            position: 'absolute',
                            top: '40px',
                            right: '40px',
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            backgroundColor: '#0A0B0F', 
                            border: `5px solid ${ACCENT}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 10px 40px rgba(0,0,0,0.8)`,
                        }}>
                            <div style={{
                                display: 'flex',
                                color: ACCENT,
                                fontSize: '72px',
                                fontWeight: 900,
                                fontFamily: 'sans-serif',
                                marginTop: '-10px',
                            }}>
                                {data.score}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: {'Content-Type': 'application/json'} });
  }
}