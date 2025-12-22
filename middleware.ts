// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Get the token (Standard NextAuth way)
  // You need to set NEXTAUTH_SECRET in .env for this to work
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // 2. Define Protected Routes
  const isStudioRoute = path.startsWith('/studio');
  const isApiRoute = path.startsWith('/api/blob') || path.startsWith('/api/translate');
  const isWelcomeRoute = path.startsWith('/welcome');

  // 3. Logic: If no token, redirect to login (or home)
  if ((isStudioRoute || isApiRoute || isWelcomeRoute) && !token) {
    // If trying to access API without auth, return 401
    if (isApiRoute) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'content-type': 'application/json' } 
      });
    }
    // Otherwise redirect to home/login
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 4. Strict Role Check for Studio (The "Director Gate")
  if (isStudioRoute && token) {
    const userRoles = (token.roles as string[]) || [];
    const hasStudioAccess = userRoles.some(role => 
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!hasStudioAccess) {
      // User is logged in but NOT authorized for Studio -> Kick to home
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 5. Allow request to proceed
  return NextResponse.next();
}

// 6. Matcher Configuration
export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};