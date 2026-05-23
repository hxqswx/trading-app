"use client";

/**
 * /sso-callback
 *
 * Clerk completes the OAuth handshake here after the provider redirects back.
 * AuthenticateWithRedirectCallback handles token exchange and session creation.
 */
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#050a13] flex items-center justify-center">
      <span className="w-9 h-9 rounded-full border-2 border-[#58a6ff] border-t-transparent animate-spin" />
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
