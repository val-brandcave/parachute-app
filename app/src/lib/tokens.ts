/**
 * Design tokens (TS mirror of the CSS variables in globals.css).
 * Palette: "Navy & Petrol" — navy primary, petrol accent, true-neutral greys.
 * Use these when a value is needed in JS (e.g. inline SVG fills, conic gradients).
 * For styling, prefer the CSS variables / utility classes.
 */
export const color = {
  navy: "#10344C",
  navyHover: "#1B4F73",
  accent: "#2A6F7F",
  accentInk: "#14505E",
  accentTint: "#DEEBEE",

  canvas: "#F6F7F8",
  surface: "#FFFFFF",
  sidebar: "#FFFFFF",
  hairline: "#EDEEF1",
  outline: "#E2E4E8",

  // Text scale
  ink: "#1A1D21",
  inkMuted: "#565C64",
  inkTertiary: "#868D96",
  inkDisabled: "#AEB4BC",

  pass: "#15834A",
  passTint: "#E3F5EA",
  flag: "#C98A12",
  flagTint: "#FCF1D8",
  fail: "#D23F34",
  failTint: "#FCE7E5",
  crit: "#7B1010",
  critTint: "#F6DCDC",
  info: "#2D6CA6",
  infoTint: "#E4EEF7",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

// No monospace anywhere — numbers use the sans face with tabular figures.
export const font = {
  display: "var(--font-display)",
  sans: "var(--font-sans-base)",
} as const;
