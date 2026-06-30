"use client";

import { Icon, IconButton } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { WB_THEMES, WB_FONTS } from "@/lib/workbook";
import type { WbDocSettings } from "@/lib/workbook-config";

const SCALES: WbDocSettings["scale"][] = ["compact", "normal", "spacious"];

const TOGGLES: { key: keyof WbDocSettings; label: string; hint: string }[] = [
  { key: "showHeader", label: "Running header", hint: "Bank name + title on each page" },
  { key: "showFooter", label: "Confidential footer", hint: "Engagement / internal-use line" },
  { key: "showLogo", label: "Show logo", hint: "Org mark on the cover" },
  { key: "showStatus", label: "Disposition badges", hint: "Accepted / overridden on findings" },
  { key: "showConfidence", label: "AI-basis footnote", hint: "Confidence + page under findings" },
  { key: "colorCoding", label: "Severity colour", hint: "Coloured left border by severity" },
  { key: "hideOverridden", label: "Hide overridden", hint: "Drop overridden findings from the body" },
];

/**
 * Customize — an edit *state* of the workbook, not a separate destination. It docks
 * as a right-hand panel over the live workbook (the workbook in the main pane is the
 * preview — edits to branding / density / what each finding shows reflect there
 * immediately). Close returns to plain reading view.
 */
export function RunCustomizePanel({ onClose }: { onClose: () => void }) {
  const { workbook, updateSettings, toggleSection } = useWorkspaceStore();
  if (!workbook) return null;

  const s = workbook.settings;

  return (
    <aside className="run-wb-dock scroll" aria-label="Customize workbook">
      <div className="run-wb-dock-head">
        <div>
          <h2 className="run-cz-title">Customize</h2>
          <p className="run-cz-sub">Edits apply to the workbook live.</p>
        </div>
        <IconButton name="close" onClick={onClose} aria-label="Close customize" />
      </div>

      <section className="run-cz-sec">
        <h3 className="run-cz-h">Theme accent</h3>
        <div className="run-cz-seg">
          {Object.entries(WB_THEMES).map(([key, t]) => (
            <button
              key={key}
              className={`run-cz-segbtn${s.theme === key ? " on" : ""}`}
              onClick={() => updateSettings({ theme: key })}
            >
              <span className="run-cz-swatch" style={{ background: t.accent }} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="run-cz-sec">
        <h3 className="run-cz-h">Heading font</h3>
        <div className="run-cz-seg">
          {Object.entries(WB_FONTS).map(([key, f]) => (
            <button
              key={key}
              className={`run-cz-segbtn${s.headingFont === key ? " on" : ""}`}
              onClick={() => updateSettings({ headingFont: key as WbDocSettings["headingFont"] })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="run-cz-sec">
        <h3 className="run-cz-h">Density</h3>
        <div className="run-cz-seg">
          {SCALES.map((sc) => (
            <button
              key={sc}
              className={`run-cz-segbtn${s.scale === sc ? " on" : ""}`}
              onClick={() => updateSettings({ scale: sc })}
            >
              {sc[0].toUpperCase() + sc.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="run-cz-sec">
        <h3 className="run-cz-h">What the doc shows</h3>
        <div className="run-cz-toggles">
          {TOGGLES.map((t) => {
            const on = !!s[t.key];
            return (
              <button
                key={t.key}
                className="run-cz-toggle"
                role="switch"
                aria-checked={on}
                onClick={() => updateSettings({ [t.key]: !on } as Partial<WbDocSettings>)}
              >
                <span className="run-cz-toggle-text">
                  <b>{t.label}</b>
                  <span>{t.hint}</span>
                </span>
                <span className={`run-cz-switch${on ? " on" : ""}`}>
                  <span className="run-cz-switch-thumb" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="run-cz-sec">
        <h3 className="run-cz-h">Sections</h3>
        <div className="run-cz-sections">
          {workbook.sections.map((sec) => (
            <button
              key={sec.id}
              className="run-cz-section"
              role="switch"
              aria-checked={sec.enabled}
              onClick={() => toggleSection(sec.id)}
            >
              <Icon name={sec.enabled ? "check-circle" : "x-circle"} size={16} />
              <span>{sec.title}</span>
              <span className={`run-cz-switch run-cz-switch--sm${sec.enabled ? " on" : ""}`}>
                <span className="run-cz-switch-thumb" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
