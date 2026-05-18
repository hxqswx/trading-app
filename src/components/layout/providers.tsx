"use client";

import { useQuotes } from "@/lib/hooks/use-quotes";

/** Mounts all global real-time hooks once at the root. */
function RuntimeHooks() {
  useQuotes();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RuntimeHooks />
      {children}
    </>
  );
}
