import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

// Define a type for the expected webhook body for better type-safety
interface WebhookBody {
  _id: string; // Added _id to check for drafts
  _type: string;
  slug?: {
    current?: string;
  };
}

// Ensure the secret is defined in your environment variables
const secret = process.env.REVALIDATION_SECRET_TOKEN;
if (!secret) {
  throw new Error('Missing REVALIDATION_SECRET_TOKEN in environment variables.');
}

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

    // Ignore any webhooks related to draft documents.
    if (body._id.startsWith('drafts.')) {
      return NextResponse.json({
        status: 200,
        revalidated: false,
        now: Date.now(),
        message: 'No revalidation required for draft document',
      });
    }

    const { _type: type, slug } = body;

    // --- Revalidate Tags for Cached API Data ---
    const tagsToRevalidate: string[] = [];
    if (['review', 'article', 'news'].includes(type)) {
      tagsToRevalidate.push(`${type}s`); // e.g., 'reviews'
      tagsToRevalidate.push('paginated'); // Common tag for paginated content
      tagsToRevalidate.push('engagement-scores'); // Homepage scores depend on this
      tagsToRevalidate.push('sanity-content');
    }
    if (['author', 'reviewer', 'reporter', 'designer'].includes(type)) {
      tagsToRevalidate.push('enriched-creators');
      tagsToRevalidate.push('enriched-creator-details');
    }
    
    // THE DEFINITIVE FIX: Explicitly provide the 'max' argument to revalidateTag.
    tagsToRevalidate.forEach(tag => revalidateTag(tag, 'max'));

    // --- Revalidate Specific Page Paths ---
    const pathsToRevalidate: string[] = ['/'];
    const currentSlug = slug?.current;

    switch (type) {
      case 'review':
        pathsToRevalidate.push('/reviews');
        if (currentSlug) pathsToRevalidate.push(`/reviews/${currentSlug}`);
        break;
      case 'article':
        pathsToRevalidate.push('/articles');
        if (currentSlug) pathsToRevalidate.push(`/articles/${currentSlug}`);
        break;
      case 'news':
        pathsToRevalidate.push('/news');
        if (currentSlug) pathsToRevalidate.push(`/news/${currentSlug}`);
        break;
      case 'gameRelease':
        pathsToRevalidate.push('/releases', '/celestial-almanac');
        break;
      case 'game':
        if (currentSlug) pathsToRevalidate.push(`/games/${currentSlug}`);
        // Revalidate list pages as game info might appear there
        pathsToRevalidate.push('/reviews', '/articles', '/news');
        break;
      case 'tag':
        if (currentSlug) pathsToRevalidate.push(`/tags/${currentSlug}`);
        break;
    }
    
    // Use a Set to ensure unique paths before revalidating
    const uniquePaths = [...new Set(pathsToRevalidate)];
    uniquePaths.forEach(path => revalidatePath(path));

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      message: `Revalidated paths and tags for type: ${type}`,
      revalidatedTags: tagsToRevalidate,
      revalidatedPaths: uniquePaths,
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Error in revalidate-sanity webhook:", errorMessage);
    return new Response(errorMessage, { status: 500 });
  }
}