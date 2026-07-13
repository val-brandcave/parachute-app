"use client";

import { useState } from "react";
import { Card, Divider, Label, Switch } from "@/components/atoms";
import { ParachuteGlyph } from "@/components/atoms/BrandGlyph";
import { CURRENT_ORG } from "@/lib/current-user";

// Document brand THEMES (the exported workbook / attestation PDF), distinct from
// the app-chrome tokens. Literal hexes here are selectable content, not styling.
type Template = { key: string; name: string; primary: string; accent: string };
const TEMPLATES: Template[] = [
  { key: "navy", name: "Navy", primary: "#10344C", accent: "#C9A24B" },
  { key: "charcoal", name: "Charcoal", primary: "#26292E", accent: "#C9A24B" },
  { key: "forest", name: "Forest", primary: "#1E4633", accent: "#C9A24B" },
  { key: "burgundy", name: "Burgundy", primary: "#5E1F2A", accent: "#C9A24B" },
  { key: "slate", name: "Slate", primary: "#3A4A57", accent: "#8FB4C4" },
  { key: "royal", name: "Royal", primary: "#1E2A6B", accent: "#C9A24B" },
];

// Document typography — formal report faces (serif reads as an appraisal doc).
const FONTS: { value: string; label: string; stack: string }[] = [
  { value: "georgia", label: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
  { value: "garamond", label: "Garamond (serif)", stack: "Garamond, Georgia, serif" },
  { value: "times", label: "Times New Roman (serif)", stack: "'Times New Roman', Times, serif" },
  { value: "roboto", label: "Roboto (sans)", stack: "Roboto, Arial, sans-serif" },
  { value: "segoe", label: "Segoe UI (sans)", stack: "'Segoe UI', system-ui, sans-serif" },
  { value: "arial", label: "Arial (sans)", stack: "Arial, Helvetica, sans-serif" },
];

const SIZES: { value: string; label: string; scale: number }[] = [
  { value: "compact", label: "Compact", scale: 0.9 },
  { value: "normal", label: "Normal", scale: 1 },
  { value: "large", label: "Large", scale: 1.12 },
];

/** A titled white card, matching the Identity tab's section pattern. */
function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ padding: "var(--d-card-pad)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
        {title}
      </div>
      {desc && (
        <div style={{ color: "var(--md-on-surface-v)", fontSize: 13, marginTop: 3 }}>
          {desc}
        </div>
      )}
      <Divider style={{ margin: "14px 0" }} />
      {children}
    </Card>
  );
}

export function BrandingPanel() {
  const [templateKey, setTemplateKey] = useState("navy");
  const [font, setFont] = useState("georgia");
  const [size, setSize] = useState("normal");
  const [showLogo, setShowLogo] = useState(true);

  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0];
  const fontStack = FONTS.find((f) => f.value === font)?.stack ?? "serif";
  const scale = SIZES.find((s) => s.value === size)?.scale ?? 1;

  return (
    <div className="brand-grid">
      <div className="brand-controls">
        <Section
          title="Colour template"
          desc="The palette applied to exported workbooks and attestations."
        >
          <div className="brand-swatches" role="radiogroup" aria-label="Colour template">
            {TEMPLATES.map((t) => (
              <button
                type="button"
                key={t.key}
                role="radio"
                aria-checked={templateKey === t.key}
                className={`brand-swatch${templateKey === t.key ? " is-on" : ""}`}
                onClick={() => setTemplateKey(t.key)}
              >
                <span className="brand-swatch-tile" style={{ background: t.primary }}>
                  <span className="brand-swatch-dot" style={{ background: t.accent }} />
                </span>
                <span className="brand-swatch-name">{t.name}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Typography" desc="The type face and size used in the document body.">
          <div className="brand-row2">
            <div>
              <Label htmlFor="brand-font">Font</Label>
              <select
                id="brand-font"
                className="qfilter"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                style={{ width: "100%", height: 42 }}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brand-size">Text size</Label>
              <select
                id="brand-size"
                className="qfilter"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                style={{ width: "100%", height: 42 }}
              >
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Document options">
          <label className="brand-toggle">
            <Switch
              checked={showLogo}
              onChange={() => setShowLogo((v) => !v)}
              label="Show organization logo on exported documents"
            />
            <span>Show organization logo on exported documents</span>
          </label>
        </Section>
      </div>

      {/* Live preview — the ACTUAL workbook cover + a section peek, scaled down,
          themed by the choices above (same --wb-accent / --wb-head the real doc uses). */}
      <aside className="brand-aside">
        <div className="brand-preview">
          <div className="brand-preview-label">Preview</div>
          <div className="brand-docwrap">
            <div
              className="brand-docscale"
              style={
                {
                  "--wb-accent": template.primary,
                  "--wb-head": fontStack,
                  "--wb-body": fontStack,
                } as React.CSSProperties
              }
            >
              <div className="wb-doc">
                {/* PAGE 1 — the real branded cover */}
                <section className="wb-page wb-page--cover">
                  <span className="wb-cover-mark" aria-hidden="true">
                    <ParachuteGlyph size={420} />
                  </span>
                  <div className="wb-cover-top">
                    <span className="wb-cover-brand">
                      {showLogo && <ParachuteGlyph size={22} />} Parachute
                    </span>
                    <span className="wb-cover-conf">Confidential</span>
                  </div>
                  <div className="wb-cover-main">
                    <div className="wb-cover-eyebrow">Appraisal Review</div>
                    <h1 className="wb-cover-title" style={{ fontFamily: "var(--wb-head)" }}>
                      1200 Harbor Boulevard
                    </h1>
                    <div className="wb-cover-sub">
                      Commercial · Prepared for {CURRENT_ORG.name}
                    </div>
                  </div>
                  <div className="wb-cover-bottom">
                    <div className="wb-band-meta">
                      <Meta label="Loan #" value="LN-40837" />
                      <Meta label="Effective Date" value="July 12, 2026" />
                      <Meta label="Reviewer" value="Val Vinnakota, MAI" />
                    </div>
                  </div>
                </section>

                {/* PAGE 2 — a peek of a content section */}
                <section className="wb-page">
                  <div className="brand-secpage" style={{ fontFamily: fontStack, fontSize: `${14 * scale}px` }}>
                    <div className="brand-sec-eyebrow" style={{ color: template.primary }}>
                      SECTION 1
                    </div>
                    <div
                      className="brand-sec-h"
                      style={{ fontFamily: fontStack, fontSize: `${24 * scale}px` }}
                    >
                      Scope &amp; Summary
                    </div>
                    <p className="brand-sec-p">
                      This review evaluates the appraisal for compliance with USPAP, FIRREA,
                      and Meridian Trust credit policy. The report was found adequately
                      supported with no material deficiencies noted.
                    </p>
                    <div className="brand-sec-row">
                      <span>Property type</span>
                      <b>Commercial — Office</b>
                    </div>
                    <div className="brand-sec-row">
                      <span>Opinion of value</span>
                      <b>$4,250,000</b>
                    </div>
                    <div className="brand-sec-row">
                      <span>Overall finding</span>
                      <b>Satisfactory</b>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="brand-docfade" aria-hidden="true" />
          </div>
          <p className="cfg-hint">Applied to exported workbooks and attestations.</p>
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="wb-meta-item">
      <span className="wb-meta-l">{label}</span>
      <span className="wb-meta-v">{value}</span>
    </div>
  );
}
