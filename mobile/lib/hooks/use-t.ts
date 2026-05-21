import { useTradingStore } from "../store";
import { translations } from "../i18n";
import type { Translations } from "../i18n";

/** Returns the translation object for the current language. */
export function useT(): Translations {
  const lang = useTradingStore((s) => s.lang);
  return translations[lang];
}
