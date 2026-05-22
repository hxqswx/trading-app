/**
 * Auth helpers — re-exports Clerk's server-side auth utilities.
 *
 * Replaces the previous NextAuth configuration.
 * Client-side hooks (useUser, useClerk, etc.) come directly from "@clerk/nextjs".
 */
export { auth, currentUser } from "@clerk/nextjs/server";
