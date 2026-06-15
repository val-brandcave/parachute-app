/**
 * Design tokens (TS mirror of the CSS variables in globals.css).
 * Palette: "Slate & Teal" — navy primary, teal accent. Use these when a value
 * is needed in JS (e.g. inline SVG fills, conic gradients). For styling, prefer
 * the CSS variables / utility classes.
 */
export const color = {
  navy: "#10344C",
  navyHover: "#1B4F73",
  accent: "#0E8C8B",
  accentInk: "#0A5E5D",
  accentTint: "#DBF0EF",

  canvas: "#F4F6F8",
  surface: "#FFFFFF",
  sidebar: "#FBFCFD",
  hairline: "#EAEEF2",
  outline: "#D3DAE1",
  ink: "#16242F",
  inkMuted: "#5D6B78",

  pass: "#1F8A55",
  passTint: "#DCF0E5",
  flag: "#C2820E",
  flagTint: "#FBEECF",
  fail: "#C2392E",
  failTint: "#FBE5E1",
  crit: "#7B1010",
  critTint: "#F3D9D9",
  info: "#2C6E9B",
  infoTint: "#E1ECF3",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const font = {
  display: "var(--font-display)",
  sans: "var(--font-sans-base)",
  mono: "var(--font-mono-base)",
} as const;
