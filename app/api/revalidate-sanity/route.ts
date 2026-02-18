// app/api/revalidate-sanity/route.ts

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
      return new Response('Bad Request', { status: 400 });
    }

    // 1. STRICT FILTER: Ignore Drafts
    // If the ID starts with 'drafts.', it's an autosave. Do nothing.
    if (body._id.startsWith('drafts.')) {
      return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored draft',
        now: Date.now(),
      });
    }

    // 2. STRICT FILTER: Ignore Assets
    // Uploading images shouldn't trigger a rebuild until they are attached to a doc.
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(body._type)) {
       return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored asset',
        now: Date.now(),
      });
    }

    // 3. GRANULAR REVALIDATION
    // Instead of one big 'content' tag, we hit specific targets.
    
    const tagsToInvalidate = new Set<string>();

    // A. Always invalidate the specific document
    if (body.slug?.current) {
        tagsToInvalidate.add(body.slug.current);
    }

    // B. Invalidate the Type Collection
    // e.g. Publishing a 'review' invalidates the 'review' tag (refreshing /reviews and API)
    // It does NOT invalidate 'news' or 'articles'.
    tagsToInvalidate.add(body._type);

    // C. The Universal Base (Homepage)
    // The homepage relies on reviews, articles, news, and releases.
    // If any of these change, we must update the homepage.
    if (['review', 'article', 'news', 'gameRelease', 'homepageSettings'].includes(body._type)) {
        tagsToInvalidate.add('universal-base');
    }

    // D. Metadata/Global Lists
    // If a tag, game, or creator changes, we might need to refresh global lists
    if (['tag', 'game', 'developer', 'publisher', 'author', 'reviewer', 'reporter', 'designer', 'colorDictionary'].includes(body._type)) {
        tagsToInvalidate.add('studio-metadata');
        // Metadata changes might affect homepage too
        tagsToInvalidate.add('universal-base');
    }

    // Execute Revalidations
    tagsToInvalidate.forEach(tag => {
        // FIX: Added 'max' argument to satisfy type definition
        revalidateTag(tag, 'max');
        console.log(`[REVALIDATE] Triggered tag: ${tag}`);
    });

    return NextResponse.json({
      status: 200,
      revalidated: true,
      tags: Array.from(tagsToInvalidate),
      now: Date.now(),
    });

  } catch (err: any) {
    console.error('[REVALIDATE ERROR]', err);
    return new Response(err.message, { status: 500 });
  }
}