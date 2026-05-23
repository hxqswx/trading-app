/**
 * Next.js Proxy — Clerk middleware runs on all routes so auth() works everywhere.
 *
 * Public routes: /sign-in and all /api/* routes (APIs handle their own 401s).
 * Page routes that aren't public redirect to /sign-in if unauthenticated.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that don't require a redirect — API routes return 401 themselves
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    // For /sign-in: redirect away if already logged in
    if (req.nextUrl.pathname.startsWith("/sign-in")) {
      const { userId } = await auth();
      if (userId) return NextResponse.redirect(new URL("/", req.url));
    }
    // API routes and sign-in: let through (no protect())
    return;
  }

  // All other page routes — Clerk redirects to /sign-in if unauthenticated
  await auth.protect();
});

// Run on everything except Next.js internals and static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
