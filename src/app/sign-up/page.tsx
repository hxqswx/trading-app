"use client";

/**
 * /sign-up — redirects to /sign-in with the Register tab pre-selected.
 * The sign-in page hosts both tabs in one component, so /sign-up is an alias.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/sign-in?tab=register"); }, [router]);
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
    </div>
  );
}
