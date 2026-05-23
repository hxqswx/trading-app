/**
 * Next.js Proxy — Clerk middleware.
 *
 * KEY RULE: auth() must be called inside clerkMiddleware for EVERY request
 * that will later call auth() in a route handler or server component.
 * Returning early without calling auth() leaves no session headers on the
 * request, so downstream auth() calls throw "can't detect clerkMiddleware".
 *
 * Strategy:
 *  - API routes  → call auth() to attach session context; never protect()
 *  - /sign-in    → call auth(); if logged-in redirect to /
 *  - /sso-callback → call auth() (Clerk handles the token exchange)
 *  - everything else → auth.protect() (redirects to /sign-in if unauthed)
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isApiRoute      = createRouteMatcher(["/api/(.*)"]);
const isSignInRoute   = createRouteMatcher(["/sign-in(.*)"]);
const isCallbackRoute = createRouteMatcher(["/sso-callback(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // ── API routes ────────────────────────────────────────────────────────────
  // Always call auth() so Clerk attaches session headers to the request.
  // Do NOT call auth.protect() — route handlers return 401 themselves.
  if (isApiRoute(req)) {
    await auth();   // ← attaches session context; does NOT redirect
    return;
  }

  // ── OAuth callback ────────────────────────────────────────────────────────
  if (isCallbackRoute(req)) {
    await auth();
    return;
  }

  // ── Sign-in page ──────────────────────────────────────────────────────────
  if (isSignInRoute(req)) {
    const { userId } = await auth();
    if (userId) return NextResponse.redirect(new URL("/", req.url));
    return;
  }

  // ── All other page routes — require authentication ────────────────────────
  await auth.protect();
});

// Run on everything except Next.js internals and static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
