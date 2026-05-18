"use client";

import { useSimulator } from "@/lib/hooks/use-simulator";

function RuntimeHooks() {
  useSimulator(); // drives all real-time price updates
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
