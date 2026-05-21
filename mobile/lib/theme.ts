/**
 * Design tokens — mirrors the CSS variables in globals.css.
 * Components call useColors() to get the current palette.
 */

export const dark = {
  background: "#0d1117",
  surface:    "#161b22",
  surface2:   "#1c2128",
  border:     "#30363d",
  foreground: "#e6edf3",
  muted:      "#8b949e",
  accent:     "#58a6ff",
  green:      "#3fb950",
  red:        "#f85149",
  yellow:     "#d29922",
  purple:     "#bc8cff",
} as const;

export const light = {
  background: "#ffffff",
  surface:    "#f6f8fa",
  surface2:   "#eaeef2",
  border:     "#d0d7de",
  foreground: "#1f2328",
  muted:      "#656d76",
  accent:     "#0969da",
  green:      "#1a7f37",
  red:        "#cf222e",
  yellow:     "#9a6700",
  purple:     "#8250df",
} as const;

export type Colors = typeof dark;
export type ColorScheme = "dark" | "light";

export const themes: Record<ColorScheme, Colors> = { dark, light };
