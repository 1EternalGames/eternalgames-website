// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {

    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Double check: If they are on studio routes but lack roles (User role only)
    if (path.startsWith('/studio') && token) {
      const userRoles = (token.roles as string[]) || [];
      const hasStudioAccess = userRoles.some(role => 
        ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
      );

      if (!hasStudioAccess) {
        // Redirect regular users to homepage if they try to access studio
        return NextResponse.rewrite(new URL('/404', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Returns true if logged in
    },
  }
);

// Define which paths require authentication
export const config = {
  matcher: [
    // Protect the entire Studio
    "/studio/:path*",
    // Protect Blob Upload API
    "/api/blob/:path*",
    // Protect Translation API
    "/api/translate/:path*",
    // Protect User onboarding
    "/welcome",
  ],
};