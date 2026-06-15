/* eslint-disable @next/next/no-img-element */

type Variant = "white" | "blue" | "black";

export function Logo({
  variant = "white",
  full = true,
  height = 26,
  themeAware = false,
}: {
  variant?: Variant;
  full?: boolean;
  height?: number;
  /** When true, shows the navy logo in light mode and the white logo in dark mode (CSS-toggled). */
  themeAware?: boolean;
}) {
  const kind = full ? "full-logo" : "emblem";

  if (themeAware) {
    return (
      <span className="logo-themed" style={{ display: "block", height }}>
        <img
          className="logo-on-light"
          src={`/logos/parachute-${kind}-blue.svg`}
          alt="Parachute"
          style={{ height, width: "auto" }}
        />
        <img
          className="logo-on-dark"
          src={`/logos/parachute-${kind}-white.svg`}
          alt="Parachute"
          style={{ height, width: "auto" }}
        />
      </span>
    );
  }

  return (
    <img
      src={`/logos/parachute-${kind}-${variant}.svg`}
      alt="Parachute"
      style={{ height, width: "auto", display: "block" }}
    />
  );
}
