import os
import shutil

# 1. Determine the correct location (Root or src/)
target_dir = "."
if os.path.exists("src") and os.path.isdir("src"):
    target_dir = "src"

correct_path = os.path.join(target_dir, "middleware.ts")

# 2. List of "Illegal" locations for middleware in Next.js 13+
illegal_locations = [
    "app/middleware.ts",
    "app/middleware.js",
    "pages/middleware.ts",
    "pages/middleware.js",
    "middleware.ts", # If using src/, root is illegal
    "middleware.js", # If using src/, root is illegal
    "src/app/middleware.ts", # Cannot be inside app
    "_middleware.ts", # Old convention
    "app/_middleware.ts"
]

# 3. Content of the middleware (to ensure we don't lose it)
middleware_content = """import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/studio') && token) {
      const userRoles = (token.roles as string[]) || [];
      const hasStudioAccess = userRoles.some(role => 
        ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
      );

      if (!hasStudioAccess) {
        return NextResponse.rewrite(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/studio/:path*",
    "/api/blob/:path*",
    "/api/translate/:path*",
    "/welcome",
  ],
};
"""

# 4. Cleanup Logic
print(f"Targeting correct location: {correct_path}")

# If targeting src/middleware.ts, remove root/middleware.ts first
if target_dir == "src":
    if os.path.exists("middleware.ts"):
        os.remove("middleware.ts")
        print("Removed root middleware.ts (Moving to src/)")

# Check and remove illegal files
for loc in illegal_locations:
    # Don't delete the target if it matches the list (unlikely given list logic)
    if os.path.normpath(loc) == os.path.normpath(correct_path):
        continue
        
    if os.path.exists(loc):
        os.remove(loc)
        print(f"DELETED CONFLICTING FILE: {loc}")

# 5. Write the correct file fresh
with open(correct_path, "w") as f:
    f.write(middleware_content)

print(f"SUCCESS: Middleware secured at {correct_path}")