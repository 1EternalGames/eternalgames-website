import { type NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { parseBody } from 'next-sanity/webhook';

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody(req, process.env.SANITY_REVALIDATE_SECRET);

    if (!isValidSignature) {
      return new Response('Invalid Signature', { status: 401 });
    }

    if (!body?._type) {
      return new Response('Bad Request: No _type in body', { status: 400 });
    }

    const tagsToInvalidate = new Set<string>();
    
    // Always invalidate the tag matching the document type
    tagsToInvalidate.add(body._type);

    // Execute Revalidations
    tagsToInvalidate.forEach(tag => {
        revalidateTag(tag);
        console.log(`[REVALIDATE] Triggered tag: ${tag}`);
    });

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      tags: Array.from(tagsToInvalidate),
    });
  } catch (err: any) {
    console.error(err);
    return new Response(err.message, { status: 500 });
  }
}