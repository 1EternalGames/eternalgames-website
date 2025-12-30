import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

type WebhookPayload = {
  _type: string;
  _id: string;
  slug?: {
    current: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<WebhookPayload>(
      req,
      process.env.REVALIDATION_SECRET_TOKEN,
    );

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 });
    }

    if (!body?._type || !body?._id) {
      return new Response('Bad Request: Missing _type or _id', { status: 400 });
    }

    // 1. IGNORE DRAFTS
    if (body._id.startsWith('drafts.')) {
      return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored draft document',
        now: Date.now(),
      });
    }

    // 2. IGNORE SYSTEM ASSETS (The "Asset Trap" Fix)
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(body._type)) {
       return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored system asset',
        now: Date.now(),
      });
    }

    // 3. SURGICAL REVALIDATION
    
    // A. Always invalidate the specific document by its SLUG
    if (body.slug?.current) {
        revalidateTag(body.slug.current, 'max');
        console.log(`[REVALIDATE] Invalidated Slug: ${body.slug.current}`);
    }

    // B. Global Content (Menus, Lists, Feeds)
    revalidateTag('content', 'max');

    // C. Metadata Singletons
    if (['tag', 'game', 'developer', 'publisher', 'author', 'reviewer', 'reporter', 'designer'].includes(body._type)) {
        revalidateTag('studio-metadata', 'max');
    }

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      type: body._type,
      slug: body.slug?.current
    });

  } catch (err: any) {
    console.error('[REVALIDATE ERROR]', err);
    return new Response(err.message, { status: 500 });
  }
}

// Manual Handler
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
    
    revalidateTag('content', 'max');
    revalidateTag('studio-metadata', 'max');

    return NextResponse.json({ revalidated: true, message: 'Global content tags revalidated', now: Date.now() });
}