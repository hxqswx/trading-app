"use client";

import { useTradingStore } from "@/lib/store";
import { translations } from "@/lib/i18n";

/** Returns the full translation object for the current language. */
export function useT() {
  const lang = useTradingStore((s) => s.lang);
  return translations[lang];
}
