"use client";

import { useEffect } from "react";
import { useSimulator } from "@/lib/hooks/use-simulator";
import { useAlpacaStream } from "@/lib/hooks/use-alpaca-stream";
import { useTradingStore } from "@/lib/store";

/** Applies the user's chosen theme to <html data-theme="..."> */
function ThemeApplier() {
  const theme = useTradingStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [theme]);
  return null;
}

/** Runs only when the user is authenticated — no market data fetching on sign-in */
function RuntimeHooks() {
  useSimulator();
  useAlpacaStream();   // real-time Alpaca trade stream for US stocks (no-op when not configured)
  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
  /** Whether the user is authenticated (resolved server-side) */
  isAuthed: boolean;
}

export function Providers({ children, isAuthed }: ProvidersProps) {
  return (
    <>
      {/* Theme is applied regardless of auth state */}
      <ThemeApplier />
      {/* Simulator only runs inside the authenticated shell */}
      {isAuthed && <RuntimeHooks />}
      {children}
    </>
  );
}
