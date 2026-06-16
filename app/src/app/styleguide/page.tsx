/* Palette decision surface — not the app theme. Visit /styleguide to compare. */

type Role = { name: string; hex: string; ink?: string };

type Palette = {
  id: string;
  name: string;
  tagline: string;
  recommended?: boolean;
  accent: string;
  accentTint: string;
  accentInk: string;
  rationale: string;
  states: { label: string; hex: string; tint: string }[];
};

const NAVY = "#10344C";
const NEUTRALS: Role[] = [
  { name: "Canvas", hex: "#F6F7F8" },
  { name: "Surface", hex: "#FFFFFF" },
  { name: "Hairline", hex: "#EDEEF1" },
  { name: "Border", hex: "#E2E4E8" },
  { name: "Ink", hex: "#1A1D21", ink: "#fff" },
  { name: "Secondary", hex: "#565C64", ink: "#fff" },
  { name: "Tertiary", hex: "#868D96", ink: "#fff" },
  { name: "Disabled", hex: "#AEB4BC" },
];

const PALETTES: Palette[] = [
  {
    id: "petrol",
    name: "Navy & Petrol",
    tagline: "Selected — calm, credible, true-neutral",
    recommended: true,
    accent: "#2A6F7F",
    accentTint: "#DEEBEE",
    accentInk: "#14505E",
    rationale:
      "The shipped palette. Navy stays primary; a deeper petrol accent harmonizes with navy without the neon edge of the old teal. True-neutral greys (no blue cast) keep surfaces crisp, and a full text scale (primary/secondary/tertiary/disabled) replaces the old two-tone ink. Flat fills, no gradients.",
    states: [
      { label: "Pass", hex: "#15834A", tint: "#E3F5EA" },
      { label: "Flag", hex: "#C98A12", tint: "#FCF1D8" },
      { label: "Fail", hex: "#D23F34", tint: "#FCE7E5" },
      { label: "Critical", hex: "#7E1D1D", tint: "#F6DCDC" },
      { label: "Info", hex: "#2D6CA6", tint: "#E4EEF7" },
    ],
  },
  {
    id: "gold",
    name: "Heritage Gold",
    tagline: "Traditional, trustworthy banking",
    accent: "#C9A84C",
    accentTint: "#F6EFD9",
    accentInk: "#7A5C12",
    rationale:
      "The classic finance look. Risk: the gold accent sits very close to the amber 'Flagged' severity, so the brand color competes with the review system that drives the whole product.",
    states: [
      { label: "Pass", hex: "#1D6F42", tint: "#DCEEE3" },
      { label: "Flag", hex: "#B7791F", tint: "#FBEFD2" },
      { label: "Fail", hex: "#B3261E", tint: "#FBE7E5" },
      { label: "Critical", hex: "#7B1010", tint: "#F3D9D9" },
      { label: "Info", hex: "#1B4F73", tint: "#E2EAF1" },
    ],
  },
  {
    id: "teal",
    name: "Slate & Teal",
    tagline: "Previous direction — superseded",
    accent: "#0E8C8B",
    accentTint: "#DBF0EF",
    accentInk: "#0A5E5D",
    rationale:
      "A cool teal accent is cleanly separated from every severity color (green/amber/red), so the brand never competes with findings. Calm, contemporary, still serious — best fit for Calm Precision.",
    states: [
      { label: "Pass", hex: "#1F8A55", tint: "#DCF0E5" },
      { label: "Flag", hex: "#C2820E", tint: "#FBEECF" },
      { label: "Fail", hex: "#C2392E", tint: "#FBE5E1" },
      { label: "Critical", hex: "#7B1010", tint: "#F3D9D9" },
      { label: "Info", hex: "#2C6E9B", tint: "#E1ECF3" },
    ],
  },
  {
    id: "cobalt",
    name: "Cobalt Mono",
    tagline: "Sharp, tech-forward power tool",
    accent: "#2F6BFF",
    accentTint: "#E6EDFF",
    accentInk: "#1E4FCC",
    rationale:
      "Navy + a brighter cobalt reads sleek and monochrome-elegant (Linear-ish). Distinct from the warm severity colors; the accent lives near 'Info' blue, which we'd manage with weight/saturation.",
    states: [
      { label: "Pass", hex: "#16855B", tint: "#DAF0E6" },
      { label: "Flag", hex: "#B7791F", tint: "#FBEFD2" },
      { label: "Fail", hex: "#D14343", tint: "#FBE3E3" },
      { label: "Critical", hex: "#7B1010", tint: "#F3D9D9" },
      { label: "Info", hex: "#3B5B8C", tint: "#E4EAF2" },
    ],
  },
  {
    id: "plum",
    name: "Plum Signal",
    tagline: "Distinctive, sophisticated",
    accent: "#6D5B9E",
    accentTint: "#ECE7F5",
    accentInk: "#4A3C73",
    rationale:
      "A muted plum accent is unlike anything in the severity system and unlike navy — memorable and refined. Slightly more 'design-forward' than a bank may expect.",
    states: [
      { label: "Pass", hex: "#1F8A55", tint: "#DCF0E5" },
      { label: "Flag", hex: "#C2820E", tint: "#FBEECF" },
      { label: "Fail", hex: "#C2392E", tint: "#FBE5E1" },
      { label: "Critical", hex: "#7B1010", tint: "#F3D9D9" },
      { label: "Info", hex: "#45619B", tint: "#E5EAF3" },
    ],
  },
];

function Swatch({ hex, label, ink }: { hex: string; label: string; ink?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          height: 56,
          borderRadius: 10,
          background: hex,
          border: "1px solid rgba(0,0,0,.08)",
          color: ink ?? "#16242F",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: 6,
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans-base)",
          fontSize: 10,
          color: "#5D6B78",
          marginTop: 4,
        }}
      >
        {hex}
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
      <div style={{ marginBottom: 8, color: "#5D6B78", fontSize: 13 }}>
        Parachute · palette decision surface
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: 34,
          color: NAVY,
          letterSpacing: "-0.02em",
        }}
      >
        Choose the color system
      </h1>
      <p style={{ color: "#5D6B78", maxWidth: 640, marginTop: 8 }}>
        Navy <b style={{ color: NAVY, fontFamily: "var(--font-sans-base)" }}>{NAVY}</b> is
        locked as the primary. Compare accent + state colors below. Headings are Schibsted
        Grotesk, body and numbers are Inter (tabular figures) — no monospace anywhere.
      </p>

      {/* Shared neutrals */}
      <section style={{ marginTop: 28 }}>
        <h3 style={{ fontFamily: "var(--font-display)", color: NAVY, fontSize: 15 }}>
          Shared neutrals + primary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 12,
            marginTop: 12,
          }}
        >
          <Swatch hex={NAVY} label="Navy (primary)" ink="#fff" />
          {NEUTRALS.map((n) => (
            <Swatch key={n.name} hex={n.hex} label={n.name} ink={n.ink} />
          ))}
        </div>
      </section>

      {/* Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
          marginTop: 36,
        }}
      >
        {PALETTES.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              border: p.recommended ? `2px solid ${p.accent}` : "1px solid #EAEEF2",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 14px rgba(16,52,76,.06)",
            }}
          >
            {/* header band */}
            <div
              style={{
                background: NAVY,
                color: "#fff",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {p.name}
                  {p.recommended && (
                    <span
                      style={{
                        background: p.accent,
                        color: "#0c2030",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{p.tagline}</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: p.accent,
                  border: "2px solid rgba(255,255,255,.3)",
                }}
              />
            </div>

            <div style={{ padding: 20 }}>
              {/* accent swatches */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                }}
              >
                <Swatch hex={p.accent} label="Accent" ink="#fff" />
                <Swatch hex={p.accentTint} label="Accent tint" />
                <Swatch hex={p.accentInk} label="Accent ink" ink="#fff" />
              </div>

              {/* state colors */}
              <div style={{ fontSize: 11, color: "#5D6B78", margin: "16px 0 8px", fontWeight: 600 }}>
                SEVERITY / STATE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
                  gap: 8,
                }}
              >
                {p.states.map((s) => (
                  <Swatch key={s.label} hex={s.hex} label={s.label} ink="#fff" />
                ))}
              </div>

              {/* live sample */}
              <div
                style={{
                  marginTop: 18,
                  border: "1px solid #EAEEF2",
                  borderRadius: 12,
                  padding: 14,
                  background: "#F8FAFB",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    style={{
                      background: p.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: 20,
                      padding: "9px 18px",
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: "inherit",
                    }}
                  >
                    Primary action
                  </button>
                  <span
                    style={{
                      border: `1px solid ${p.accent}`,
                      color: p.accentInk,
                      borderRadius: 20,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Secondary
                  </span>
                  {p.states.slice(0, 4).map((s) => (
                    <span
                      key={s.label}
                      style={{
                        background: s.tint,
                        color: s.hex,
                        borderRadius: 8,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 12, color: "#16242F" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>
                    Cap rate 5.25% below market range
                  </span>
                  <div style={{ fontSize: 12.5, color: "#5D6B78", marginTop: 2 }}>
                    Confidence{" "}
                    <b style={{ fontFamily: "var(--font-sans-base)", color: p.accentInk }}>
                      88%
                    </b>{" "}
                    · Loan{" "}
                    <b style={{ fontFamily: "var(--font-sans-base)" }}>#LN-4471</b>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: "#5D6B78", marginTop: 14, lineHeight: 1.55 }}>
                {p.rationale}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
