// app/api/revalidate/route.ts

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to delay execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path, delay, token } = body;

  // 1. Security Check: Validate the secret token
  if (token !== process.env.REVALIDATION_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  // 2. Input Validation
  if (!path || typeof path !== 'string' || typeof delay !== 'number') {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  // 3. Perform the delayed revalidation
  if (delay > 0) {
    await wait(delay);
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: `Error revalidating path: ${path}` }, { status: 500 });
  }
}

















