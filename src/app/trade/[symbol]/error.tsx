"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function TradeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Trade page error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-[rgba(248,81,73,0.1)] flex items-center justify-center">
          <AlertTriangle size={20} className="text-[var(--red)]" />
        </div>
        <h2 className="text-base font-semibold">Something went wrong</h2>
        <p className="text-sm text-[var(--muted)]">{error.message}</p>
        <Button variant="outline" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
