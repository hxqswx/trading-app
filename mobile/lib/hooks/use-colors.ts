import { useTradingStore } from "../store";
import { themes } from "../theme";
import type { Colors } from "../theme";

/** Returns the current color palette based on the active theme. */
export function useColors(): Colors {
  const theme = useTradingStore((s) => s.theme);
  return themes[theme];
}
