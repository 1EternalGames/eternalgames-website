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

    if (body._id.startsWith('drafts.')) {
      return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored draft',
        now: Date.now(),
      });
    }

    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(body._type)) {
       return NextResponse.json({
        status: 200,
        revalidated: false,
        message: 'Ignored asset',
        now: Date.now(),
      });
    }

    const tagsToInvalidate = new Set<string>();

    if (body.slug?.current) {
        tagsToInvalidate.add(body.slug.current);
    }

    tagsToInvalidate.add(body._type);

    if (['review', 'article', 'news', 'gameRelease', 'homepageSettings'].includes(body._type)) {
        tagsToInvalidate.add('universal-base');
    }

    if (['tag', 'game', 'developer', 'publisher', 'author', 'reviewer', 'reporter', 'designer', 'colorDictionary'].includes(body._type)) {
        tagsToInvalidate.add('studio-metadata');
        tagsToInvalidate.add('universal-base');
    }

    tagsToInvalidate.forEach(tag => {
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