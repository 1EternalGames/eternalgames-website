// app/api/revalidate-sanity/route.ts
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

type WebhookPayload = {
  _type: string
  slug?: {
    current: string
  }
}

// Sanity Webhook Handler (POST)
export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<WebhookPayload>(
      req,
      process.env.REVALIDATION_SECRET_TOKEN,
    )

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    if (!body?._type) {
      return new Response('Bad Request: Missing _type', { status: 400 })
    }

    // Revalidate the specific content type with 'max' profile
    revalidateTag(body._type, 'max')
    
    // Also revalidate the global 'content' tag
    revalidateTag('content', 'max')
    
    console.log(`[REVALIDATE] Tag: ${body._type} & content`);

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      type: body._type,
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
}

// Manual/Cron Handler (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const tag = searchParams.get('tag');

    if (secret !== process.env.REVALIDATION_SECRET_TOKEN) {
        return new Response('Invalid token', { status: 401 });
    }

    if (tag) {
        revalidateTag(tag, 'max');
        return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    }
    
    // Fallback: Revalidate everything
    revalidateTag('content', 'max');
    revalidateTag('review', 'max');
    revalidateTag('article', 'max');
    revalidateTag('news', 'max');
    revalidateTag('gameRelease', 'max');
    revalidateTag('studio-metadata', 'max');

    return NextResponse.json({ revalidated: true, message: 'Global content tags revalidated', now: Date.now() });
}