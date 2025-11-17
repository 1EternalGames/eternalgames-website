// app/api/revalidate-sanity/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import prisma from '@/lib/prisma'; // Prisma is now available

export const runtime = 'nodejs'; // <-- ADDED: Force Node.js runtime for Prisma access

interface WebhookBody {
  _id: string;
  _type: string;
  slug?: {
    current?: string;
  };
  game?: { _ref: string };
  tags?: { _ref: string }[];
  category?: { _ref: string };
  authors?: { _ref: string }[];
  reporters?: { _ref: string }[];
}

const secret = process.env.REVALIDATION_SECRET_TOKEN;
if (!secret) {
  throw new Error('Missing REVALIDATION_SECRET_TOKEN in environment variables.');
}

const slugsFromRefsQuery = groq`*[_id in $refs && defined(slug.current)]{ "slug": slug.current }`;

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<WebhookBody>(req, secret);

    if (!isValidSignature) {
      const message = 'Invalid signature';
      return new Response(JSON.stringify({ message, isValidSignature, body }), { status: 401 });
    }

    if (!body?._type || !body?._id) {
      return NextResponse.json({ message: 'Bad Request: Missing _type or _id in body' }, { status: 400 });
    }

    if (body._id.startsWith('drafts.')) {
      return NextResponse.json({
        status: 200,
        revalidated: false,
        now: Date.now(),
        message: 'No revalidation required for draft document',
      });
    }

    const { _type: type, slug } = body;
    const pathsToRevalidate = new Set<string>(['/']);
    const currentSlug = slug?.current;

    switch (type) {
      case 'review':
        pathsToRevalidate.add('/reviews');
        if (currentSlug) pathsToRevalidate.add(`/reviews/${currentSlug}`);
        break;
      case 'article':
        pathsToRevalidate.add('/articles');
        if (currentSlug) pathsToRevalidate.add(`/articles/${currentSlug}`);
        break;
      case 'news':
        pathsToRevalidate.add('/news');
        if (currentSlug) pathsToRevalidate.add(`/news/${currentSlug}`);
        break;
      case 'gameRelease':
        pathsToRevalidate.add('/releases');
        pathsToRevalidate.add('/celestial-almanac');
        break;
      case 'game':
        if (currentSlug) pathsToRevalidate.add(`/games/${currentSlug}`);
        pathsToRevalidate.add('/reviews');
        pathsToRevalidate.add('/articles');
        pathsToRevalidate.add('/news');
        break;
      case 'tag':
        if (currentSlug) pathsToRevalidate.add(`/tags/${currentSlug}`);
        break;
    }

    if (['review', 'article', 'news'].includes(type)) {
      const relatedRefs: string[] = [];
      if (body.game?._ref) relatedRefs.push(body.game._ref);
      if (body.tags) relatedRefs.push(...body.tags.map(t => t._ref));
      if (body.category?._ref) relatedRefs.push(body.category._ref);
      
      if (relatedRefs.length > 0) {
        const relatedSlugs = await sanityWriteClient.fetch<{ slug: string }[]>(slugsFromRefsQuery, { refs: relatedRefs });
        relatedSlugs.forEach(item => {
          pathsToRevalidate.add(`/games/${item.slug}`);
          pathsToRevalidate.add(`/tags/${item.slug}`);
        });
      }
      
      const creatorRefs = [...(body.authors || []), ...(body.reporters || [])].map(c => c._ref);
      if (creatorRefs.length > 0) {
        const creatorUsernames = await sanityWriteClient.fetch<string[]>(
          groq`*[_id in $refs && defined(prismaUserId)].prismaUserId`, { refs: creatorRefs }
        );
        
        if (creatorUsernames.length > 0) {
            const users = await prisma.user.findMany({
                where: { id: { in: creatorUsernames } },
                select: { username: true }
            });
            users.forEach(user => {
                if(user.username) pathsToRevalidate.add(`/creators/${user.username}`);
            });
        }
      }
    }
    
    const tagsToRevalidate: string[] = [];
     if (['review', 'article', 'news'].includes(type)) {
      tagsToRevalidate.push(`${type}s`, 'paginated', 'engagement-scores', 'sanity-content-detail');
    }
    if (['author', 'reviewer', 'reporter', 'designer'].includes(type)) {
      tagsToRevalidate.push('enriched-creators', 'enriched-creator-details');
    }
    if (type === 'game') {
        tagsToRevalidate.push('sanity-content-detail');
    }
    
    // THE FIX: Added 'layout' argument to all revalidateTag calls
    tagsToRevalidate.forEach(tag => revalidateTag(tag, 'layout'));


    const finalPaths = Array.from(pathsToRevalidate);
    finalPaths.forEach(path => revalidatePath(path));

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      message: `Revalidated paths and tags for type: ${type}`,
      revalidatedTags: tagsToRevalidate,
      revalidatedPaths: finalPaths,
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Error in revalidate-sanity webhook:", errorMessage);
    return new Response(errorMessage, { status: 500 });
  }
}