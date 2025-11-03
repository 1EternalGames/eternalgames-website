// app/api/cron/revalidate-scheduled/route.ts

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';

// This is the CRON job handler. It is secured by a secret token from Vercel.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('غير مصرح لك.', { status: 401 });
  }

  // Find all documents that were scheduled to be published in the last minute
  // and are now past their publication date.
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const query = groq`*[_type in ["مراجعة", "مقالة", "خبر"] && publishedAt >= $oneMinuteAgo && publishedAt < $now] {
    _type,
    "slug": slug.current
  }`;

  try {
    const docsToRevalidate: { _type: string; slug: string }[] = await sanityWriteClient.fetch(query, {
      oneMinuteAgo: oneMinuteAgo.toISOString(),
      now: now.toISOString(),
    });

    if (docsToRevalidate.length === 0) {
      return NextResponse.json({ success: true, message: 'No documents to revalidate.' });
    }

    // Use a Set to avoid revalidating the same path multiple times
    const pathsToRevalidate = new Set<string>();
    docsToRevalidate.forEach(doc => {
      const contentTypePlural = doc._type === 'خبر' ? 'خبر' : `${doc._type}s`;
      pathsToRevalidate.add(`/${contentTypePlural}`); // e.g., /articles
      pathsToRevalidate.add(`/${contentTypePlural}/${doc.slug}`); // e.g., /articles/my-slug
    });

    // Trigger revalidation for all unique paths
    pathsToRevalidate.forEach(path => {
      revalidatePath(path);
    });

    return NextResponse.json({ success: true, revalidatedPaths: Array.from(pathsToRevalidate) });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, message: 'Cron job failed.' }, { status: 500 });
  }
}

















