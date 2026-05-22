/**
 * Next.js 16 Proxy — protects all page routes using Clerk.
 *
 * Public routes: /sign-in (and static assets / API routes are excluded via matcher).
 * Everything else requires a Clerk session; unauthenticated users are
 * redirected to /sign-in automatically by Clerk's auth.protect().
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Already signed in → redirect away from sign-in page
  if (isPublicRoute(req)) {
    const { userId } = await auth();
    if (userId) return NextResponse.redirect(new URL("/", req.url));
    return; // unauthenticated on public route — allow
  }

  // Protected route — Clerk redirects to /sign-in if not authenticated
  await auth.protect();
});

// Run proxy on page routes only — skip API routes and static assets
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
