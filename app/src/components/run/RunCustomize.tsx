"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Icon, IconButton } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { WB_THEMES, WB_FONTS } from "@/lib/workbook";
import type { WbDocSettings, WbSection } from "@/lib/workbook-config";
import { cn } from "@/lib/utils";

const SCALES: WbDocSettings["scale"][] = ["compact", "normal", "spacious"];

const TOGGLES: { key: keyof WbDocSettings; label: string; hint: string }[] = [
  { key: "showHeader", label: "Running header", hint: "Bank name + title on each page" },
  { key: "showFooter", label: "Confidential footer", hint: "Engagement / internal-use line" },
  { key: "showLogo", label: "Show logo", hint: "Org mark on the cover" },
  { key: "showStatus", label: "Disposition badges", hint: "Concurred / edited on findings" },
  { key: "showConfidence", label: "AI-basis footnote", hint: "Confidence + page under findings" },
  { key: "colorCoding", label: "Severity colour", hint: "Coloured left border by severity" },
  { key: "hideOverridden", label: "Hide edited", hint: "Drop edited findings from the body" },
];

/**
 * Customize — an edit *state* of the workbook, not a separate destination. It docks
 * as a right-hand panel over the live workbook (the workbook in the main pane is the
 * preview — edits to branding / density / what each finding shows reflect there
 * immediately). Close returns to plain reading view.
 */
export function RunCustomizePanel({ onClose }: { onClose: () => void }) {
  const {
    workbook,
    updateSettings,
    toggleSection,
    reorderSections,
    resetSectionOrder,
    defaultSectionOrder,
  } = useWorkspaceStore();
  if (!workbook) return null;

  const s = workbook.settings;
  const sections = workbook.sections;
  const shownCount = sections.filter((sec) => sec.enabled).length;
  // Reset is only meaningful once the order actually diverges from the default.
  const orderIsDefault =
    sections.length === defaultSectionOrder.length &&
    sections.every((sec, i) => sec.id === defaultSectionOrder[i]);

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
        <div className="run-cz-sec-head">
          <h3 className="run-cz-h">Sections</h3>
          <span className="run-cz-count">
            {shownCount} of {sections.length} shown
          </span>
          <button
            type="button"
            className="run-cz-reset"
            onClick={resetSectionOrder}
            disabled={orderIsDefault}
          >
            Reset order
          </button>
        </div>
        <Reorder.Group
          as="ol"
          axis="y"
          values={sections}
          onReorder={reorderSections}
          className="run-cz-sections"
        >
          {sections.map((sec) => (
            <SectionRow key={sec.id} section={sec} onToggle={() => toggleSection(sec.id)} />
          ))}
        </Reorder.Group>
      </section>
    </aside>
  );
}

/** A draggable section row: grip handle · title (struck + dimmed when off) ·
 *  on/off switch. Drag is handle-only (`dragListener={false}`) so the switch and
 *  row body stay clickable. Mirrors the review-details Builder's SectionRow. */
function SectionRow({ section, onToggle }: { section: WbSection; onToggle: () => void }) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className={cn("run-cz-section", !section.enabled && "is-off", dragging && "is-dragging")}
      whileDrag={{ scale: 1.015 }}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
    >
      <button
        type="button"
        className="run-cz-grip"
        aria-label={`Drag to reorder ${section.title}`}
        onPointerDown={(e) => controls.start(e)}
      >
        <Icon name="grip" size={16} />
      </button>
      <span className="run-cz-sec-title">{section.title}</span>
      <button
        type="button"
        className={`run-cz-switch run-cz-switch--sm${section.enabled ? " on" : ""}`}
        role="switch"
        aria-checked={section.enabled}
        aria-label={`Toggle ${section.title}`}
        onClick={onToggle}
      >
        <span className="run-cz-switch-thumb" />
      </button>
    </Reorder.Item>
  );
}
