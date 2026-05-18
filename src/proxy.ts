/**
 * Next.js 16 Proxy (formerly Middleware) — protects all page routes.
 *
 * Public routes: /sign-in, all /api/* routes, Next.js internals, static assets.
 * Everything else requires an active session; unauthenticated users are
 * redirected to /sign-in, then bounced back via callbackUrl after sign-in.
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn   = !!session;
  const isAuthPage   = nextUrl.pathname === "/sign-in" || nextUrl.pathname === "/sign-up";

  // Already signed in → keep away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Not signed in → redirect to sign-in, preserve callbackUrl
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/sign-in", req.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Run proxy on page routes only — skip API routes and static assets
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
