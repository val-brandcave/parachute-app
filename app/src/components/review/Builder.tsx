"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  Button,
  Icon,
  Switch,
  Input,
  Textarea,
  Label,
  Chip,
  Tooltip,
  type IconName,
} from "@/components/atoms";
import { SegmentedControl, ActionMenu } from "@/components/molecules";
import { ReviewActions } from "@/components/review/ReviewChrome";
import { useWorkspaceStore, useTemplatesStore, useUsersStore } from "@/store";
import { useReview } from "@/store/useReview";
import { CURRENT_USER } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import {
  recommendation as deriveRecommendation,
  inheritedLayout,
  layoutLabel,
  profileFor,
  WB_THEMES,
  type RiskRating,
} from "@/lib/workbook";
import {
  PALETTE_TYPES,
  SINGLETON_TYPES,
  SECTION_TYPE_LABEL,
  availableCategories,
  defaultWorkbookConfig,
  newSection,
  sectionListLabels,
  type WbSection,
  type WbSectionType,
  type WbDocSettings,
} from "@/lib/workbook-config";
import type { Finding, MergeField } from "@/types";
import { WorkbookPreview } from "./WorkbookPreview";

/**
 * Workbook Builder — the layout/section authoring tool (its own Technical
 * sub-view, decision-#2 reversal). A full 3-pane editor:
 *   LEFT   — the section list (reorder · show/hide · delete) + add-section palette
 *   CENTER — context-sensitive editor: Document Settings when nothing is selected,
 *            otherwise the selected section's config (findings category filters,
 *            exhibit series/mode, sensitivity range, SWOT placement, free-text body)
 *   RIGHT  — a live mini-preview ⇄ template library + merge-field legend
 * plus a TOP import-from-appraisal band. Everything edits the per-review
 * `WorkbookConfig` in the workspace store; the doc renders from the same config,
 * inheriting the org default `WorkbookLayout` (resolved by property profile).
 * Reviewer-gated — a recipient/read-only viewer sees the Workbook, not this.
 */

const TYPE_ICON: Record<WbSectionType, IconName> = {
  summary: "document",
  findings: "reviews",
  exhibits: "checklist",
  sensitivity: "filter",
  swot: "info",
  conditions: "checklist",
  returns: "undo",
  conclusion: "edit",
  freeText: "document",
  certification: "book",
};

const MERGE_FIELDS: { token: MergeField; desc: string }[] = [
  { token: "property", desc: "Subject property address" },
  { token: "page", desc: "Cited appraisal page" },
  { token: "topic", desc: "Finding category / topic" },
  { token: "action", desc: "Required corrective action" },
  { token: "condition", desc: "Condition wording" },
  { token: "detail", desc: "Finding analysis detail" },
];

export function Builder({ reviewId }: { reviewId: string }) {
  const {
    findings,
    states,
    exhibits,
    workbook,
    signature,
    filing,
    loadReview,
    ensureWorkbook,
    resetWorkbook,
    reorderSections,
    toggleSection,
    deleteSection,
    addSection,
    updateSection,
    updateSettings,
  } = useWorkspaceStore();
  const layouts = useTemplatesStore((s) => s.layouts);
  const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
  const { users, fetchUsers, byId } = useUsersStore();
  const review = useReview(reviewId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightMode, setRightMode] = useState<"preview" | "templates">("preview");
  const [editing, setEditing] = useState(true);
  // "From the appraisal" source tray — collapsed by default (occasional action).
  const [importsOpen, setImportsOpen] = useState(false);

  useEffect(() => {
    if (reviewId) loadReview(reviewId);
  }, [reviewId, loadReview]);
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);

  const layout = useMemo(
    () => (review ? inheritedLayout(layouts, profileFor(review.propertyType)) : undefined),
    [layouts, review],
  );

  useEffect(() => {
    if (review && findings.length) {
      ensureWorkbook(defaultWorkbookConfig(layout, findings, exhibits));
    }
  }, [review, findings, exhibits, layout, ensureWorkbook]);

  if (!review || !workbook) {
    return <div className="fm-state text-secondary">Loading builder…</div>;
  }

  const sections = workbook.sections;
  const selected = selectedId ? sections.find((s) => s.id === selectedId) ?? null : null;
  const presentTypes = new Set(sections.map((s) => s.type));

  // Section numbers mirroring the compiled doc (body 1,2,3…; appendix A,B…;
  // hidden / empty-auto → null shown as a muted dash).
  const sectionLabels = sectionListLabels(sections, {
    hasExhibits: !!exhibits,
    conditionsCount: findings.filter((f) => states[f.id]?.condition).length,
    returnedCount: workbook.settings.hideRejected
      ? 0
      : findings.filter((f) => (states[f.id]?.disposition ?? "pending") === "rejected").length,
  });

  const risk: RiskRating = review.riskRating ?? "moderate";
  const recommendation = deriveRecommendation(findings, states);
  const reviewerName = byId(review.assigneeId)?.signatureName || CURRENT_USER.signatureName;

  const addType = (type: WbSectionType) => {
    const id = addSection(newSection(type));
    setSelectedId(id);
    setRightMode("preview");
  };

  const removeSection = (id: string) => {
    deleteSection(id);
    if (selectedId === id) setSelectedId(null);
  };

  const importSources = exhibits?.imported ?? [];
  const importedTitles = new Set(
    sections.filter((s) => s.imported).map((s) => s.title),
  );
  const addImport = (title: string, body: string) => {
    const id = addSection({
      type: "freeText",
      title,
      enabled: true,
      appendix: true,
      imported: true,
      body,
    });
    setSelectedId(id);
    setRightMode("preview");
  };

  const resetToInherited = () => {
    resetWorkbook(defaultWorkbookConfig(layout, findings, exhibits));
    setSelectedId(null);
  };

  return (
    <div className="bld">
      {/* view actions → projected into the shared control row (tabs · actions).
          The inherited-layout context + Reset now live in the Document Settings
          panel header (no standalone band); the Templates pane marks the base. */}
      <ReviewActions>
        <span className={cn("bld-role", editing ? "is-on" : "is-off")}>
          <Icon name={editing ? "edit" : "eye"} size={13} />
          {editing ? "Reviewer editing" : "Read-only"}
        </span>
        <Switch checked={editing} onChange={setEditing} label="Reviewer editing mode" />
      </ReviewActions>

      {/* ---- 3-pane authoring grid ---- */}
      <div className={cn("bld-3", !editing && "is-readonly")}>
        {/* LEFT — sections + palette */}
        <aside className="bld-pane bld-left">
          <button
            className={cn("bld-doc-btn", !selected && "on")}
            onClick={() => setSelectedId(null)}
          >
            <Icon name="settings" size={15} />
            <span>Document settings</span>
            <Icon name="chevron-right" size={15} className="bld-doc-chev" />
          </button>

          <div className="bld-pane-h">
            <Icon name="document" size={14} /> Sections
            <span className="bld-count">{sections.length}</span>
          </div>

          <Reorder.Group
            as="ol"
            axis="y"
            values={sections}
            onReorder={reorderSections}
            className="bld-seclist"
          >
            {sections.map((s) => (
              <SectionRow
                key={s.id}
                section={s}
                label={sectionLabels[s.id]}
                selected={selectedId === s.id}
                editing={editing}
                onSelect={() => setSelectedId(s.id)}
                onToggle={() => toggleSection(s.id)}
                onDelete={() => removeSection(s.id)}
                onToggleAppendix={() => updateSection(s.id, { appendix: !s.appendix })}
              />
            ))}
          </Reorder.Group>

          <div className="bld-pane-h">
            <Icon name="add" size={14} /> Add section
          </div>
          <div className="bld-palette">
            {PALETTE_TYPES.map((t) => {
              const dim = SINGLETON_TYPES.includes(t) && presentTypes.has(t);
              return (
                <button
                  key={t}
                  className="bld-palette-btn"
                  disabled={!editing || dim}
                  title={dim ? "Already in the document" : undefined}
                  onClick={() => addType(t)}
                >
                  <Icon name={TYPE_ICON[t]} size={15} />
                  {SECTION_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>

          {/* import-from-appraisal source tray — pull appraisal narrative into the
              document as appendix sections (replaces the old standalone band) */}
          {importSources.length > 0 && (
            <div className="bld-srcgroup">
              <button
                className="bld-srcgroup-h"
                onClick={() => setImportsOpen((o) => !o)}
                aria-expanded={importsOpen}
              >
                <Icon name="download" size={14} />
                From the appraisal
                <span className="bld-count">{importSources.length}</span>
                <Icon name="chevron-down" size={15} className="bld-srcgroup-chev" />
              </button>

              {importsOpen && (
                <div className="bld-srclist">
                  {importSources.map((s) => {
                    const added = importedTitles.has(s.title);
                    return (
                      <div key={s.id} className={cn("bld-src", added && "is-added")}>
                        <span className="bld-src-title">{s.title}</span>
                        {added ? (
                          <span className="bld-src-added">
                            <Icon name="check" size={13} /> Added
                          </span>
                        ) : (
                          <button
                            className="bld-src-add"
                            aria-label={`Add ${s.title}`}
                            disabled={!editing}
                            onClick={() => addImport(s.title, s.body)}
                          >
                            <Icon name="add" size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER — editor */}
        <section className="bld-pane bld-center scroll">
          {selected ? (
            <SectionEditor
              key={selected.id}
              section={selected}
              findings={findings}
              exhibitCols={exhibits?.sensitivity.cols.length ?? 0}
              update={(patch) => updateSection(selected.id, patch)}
              onDelete={() => removeSection(selected.id)}
            />
          ) : (
            <DocumentSettings
              settings={workbook.settings}
              update={updateSettings}
              baseLabel={layoutLabel(layout)}
              onReset={editing ? resetToInherited : undefined}
            />
          )}
        </section>

        {/* RIGHT — preview ⇄ templates */}
        <aside className="bld-pane bld-right">
          <div className="bld-right-toggle">
            <SegmentedControl
              options={[
                { value: "preview", label: "Live preview" },
                { value: "templates", label: "Templates" },
              ]}
              value={rightMode}
              onChange={setRightMode}
            />
          </div>

          {rightMode === "preview" ? (
            <div className="bld-mini scroll">
              <div className="bld-mini-doc">
                <WorkbookPreview
                  review={review}
                  findings={findings}
                  states={states}
                  exhibits={exhibits}
                  config={workbook}
                  recommendation={recommendation}
                  risk={risk}
                  reviewerName={reviewerName}
                  reviewedAt={review.orderedAt}
                  signature={signature}
                  filing={filing}
                />
              </div>
            </div>
          ) : (
            <div className="bld-templates scroll">
              <div className="bld-tpl-h">Current base</div>
              <p className="bld-tpl-note">
                This review&rsquo;s layout derives from the base below. Applying another replaces
                the section set — your per-review edits are re-derived from it.
              </p>
              {(() => {
                const baseId = workbook.baseLayoutId;
                const base = layouts.find((l) => l.id === baseId);
                const others = layouts.filter((l) => l.id !== baseId);
                const card = (l: (typeof layouts)[number], isBase: boolean) => (
                  <div key={l.id} className={cn("bld-tpl", isBase && "is-base")}>
                    <div className="bld-tpl-main">
                      <span className="bld-tpl-name">{l.name}</span>
                      <span className="bld-tpl-meta">
                        {l.profile}
                        {l.isDefault && <Chip tone="accent">Default</Chip>}
                      </span>
                    </div>
                    {isBase ? (
                      <span className="bld-tpl-inuse">
                        <Icon name="check" size={14} /> In use
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!editing}
                        onClick={() => {
                          resetWorkbook(defaultWorkbookConfig(l, findings, exhibits));
                          setSelectedId(null);
                          setRightMode("preview");
                        }}
                      >
                        Use as base
                      </Button>
                    )}
                  </div>
                );
                return (
                  <>
                    {base && card(base, true)}
                    {others.length > 0 && (
                      <>
                        <div className="bld-tpl-h" style={{ marginTop: 16 }}>
                          Other org layouts
                        </div>
                        {others.map((l) => card(l, false))}
                      </>
                    )}
                  </>
                );
              })()}

              <div className="bld-tpl-h" style={{ marginTop: 18 }}>
                Merge fields
              </div>
              <p className="bld-tpl-note">
                Tokens that fill from the finding when a response template is applied — usable in
                free-text narrative.
              </p>
              <ul className="bld-merge">
                {MERGE_FIELDS.map((m) => (
                  <li key={m.token}>
                    <code className="bld-merge-tok">{`{{${m.token}}}`}</code>
                    <span>{m.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ---------- Section list row (drag-to-reorder via a grip handle) ---------- */

function SectionRow({
  section,
  label,
  selected,
  editing,
  onSelect,
  onToggle,
  onDelete,
  onToggleAppendix,
}: {
  section: WbSection;
  label: string | null;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onToggleAppendix: () => void;
}) {
  const controls = useDragControls();
  // Single-line row: grip · number · title (ellipsis+tooltip) · small switch · ⋯.
  // Type & appendix badges are gone — the letter label signals appendix, the title
  // names the section; Delete (+ move-to-appendix) lives in the ⋯ menu.
  const canAppendix = section.type === "swot" || section.type === "freeText";
  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className={cn("bld-secrow", selected && "on", !section.enabled && "is-off")}
      onClick={onSelect}
    >
      <button
        type="button"
        className="bld-grip"
        aria-label="Drag to reorder"
        disabled={!editing}
        onPointerDown={(e) => {
          if (editing) controls.start(e);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="grip" size={16} />
      </button>

      <span className={cn("bld-secnum", label === null && "is-off")}>{label ?? "–"}</span>

      <TruncTitle text={section.title} />

      <span className="bld-secrow-actions" onClick={(e) => e.stopPropagation()}>
        <Switch
          size="sm"
          checked={section.enabled}
          onChange={onToggle}
          label={`Toggle ${section.title}`}
          disabled={!editing}
        />
        {editing && (
          <ActionMenu
            tooltip="More actions"
            items={[
              ...(canAppendix
                ? [
                    {
                      label: section.appendix ? "Move to body" : "Move to appendix",
                      icon: "book" as IconName,
                      onClick: onToggleAppendix,
                    },
                    { divider: true },
                  ]
                : []),
              { label: "Delete section", icon: "trash" as IconName, danger: true, onClick: onDelete },
            ]}
          />
        )}
      </span>
    </Reorder.Item>
  );
}

/** Section title that ellipsises and shows a tooltip ONLY when actually clipped. */
function TruncTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [trunc, setTrunc] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTrunc(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return (
    <Tooltip content={text} block disabled={!trunc}>
      <span ref={ref} className="bld-secrow-title">
        {text}
      </span>
    </Tooltip>
  );
}

/* ---------- Document settings editor (center, no section selected) ---------- */

function DocumentSettings({
  settings,
  update,
  baseLabel,
  onReset,
}: {
  settings: WbDocSettings;
  update: (patch: Partial<WbDocSettings>) => void;
  /** The org layout this doc inherits from — shown as the panel's base caption. */
  baseLabel: string;
  /** Revert the whole config to the inherited layout's default; omit to disable. */
  onReset?: () => void;
}) {
  return (
    <div className="bld-editor">
      <div className="bld-editor-head">
        <Icon name="settings" size={18} />
        <div>
          <h3>Document settings</h3>
          <p>Branding, what each finding shows, and the risk wording — applied to the whole doc.</p>
        </div>
      </div>

      {/* inherited-layout context (replaces the old standalone band) + reset */}
      <div className="bld-base">
        <span className="bld-base-l">
          <Icon name="templates" size={14} />
          Based on <b>{baseLabel}</b>
        </span>
        {onReset && (
          <Button variant="ghost" size="sm" iconLeft="undo" onClick={onReset}>
            Reset to inherited
          </Button>
        )}
      </div>

      <FieldGroup label="Theme accent">
        <SegmentedControl
          options={Object.keys(WB_THEMES).map((k) => ({ value: k, label: WB_THEMES[k].label }))}
          value={settings.theme}
          onChange={(v) => update({ theme: v })}
        />
      </FieldGroup>

      <FieldGroup label="Heading font">
        <SegmentedControl
          options={[
            { value: "display", label: "Schibsted Grotesk" },
            { value: "body", label: "Inter" },
          ]}
          value={settings.headingFont}
          onChange={(v) => update({ headingFont: v as "display" | "body" })}
        />
      </FieldGroup>

      <FieldGroup label="Density">
        <SegmentedControl
          options={[
            { value: "compact", label: "Compact" },
            { value: "normal", label: "Normal" },
            { value: "spacious", label: "Spacious" },
          ]}
          value={settings.scale}
          onChange={(v) => update({ scale: v as "compact" | "normal" | "spacious" })}
        />
      </FieldGroup>

      <div className="bld-sub-h">Header &amp; footer</div>
      <ToggleRow
        label="Running header"
        hint="Bank name + document title at the top of the page"
        checked={settings.showHeader}
        onChange={(v) => update({ showHeader: v })}
      />
      <ToggleRow
        label="Confidential footer"
        hint="Engagement / internal-use footer line"
        checked={settings.showFooter}
        onChange={(v) => update({ showFooter: v })}
      />
      <ToggleRow
        label="Organization logo"
        hint="Show the bank mark in the header"
        checked={settings.showLogo}
        onChange={(v) => update({ showLogo: v })}
      />

      <div className="bld-sub-h">Findings</div>
      <ToggleRow
        label="Show disposition status"
        hint="Concur / Override / Revision badges on each finding"
        checked={settings.showStatus}
        onChange={(v) => update({ showStatus: v })}
      />
      <ToggleRow
        label="Show AI basis & confidence"
        hint="The AI-basis footnote (status · confidence · stage · page)"
        checked={settings.showConfidence}
        onChange={(v) => update({ showConfidence: v })}
      />
      <ToggleRow
        label="Severity colour-coding"
        hint="Colour the left edge of each finding by severity"
        checked={settings.colorCoding}
        onChange={(v) => update({ colorCoding: v })}
      />
      <ToggleRow
        label="Hide edited findings"
        hint="Omit reviewer-edited findings from the body"
        checked={settings.hideOverridden}
        onChange={(v) => update({ hideOverridden: v })}
      />
      <ToggleRow
        label="Hide rejected findings"
        hint="Omit the Returned-to-appraiser section"
        checked={settings.hideRejected}
        onChange={(v) => update({ hideRejected: v })}
      />

      <div className="bld-sub-h">Risk wording</div>
      <p className="bld-editor-note">
        The sentence printed beside the risk badge and in the conclusion, per derived risk level.
      </p>
      {(["low", "moderate", "elevated"] as RiskRating[]).map((level) => (
        <FieldGroup key={level} label={`${level[0].toUpperCase()}${level.slice(1)} risk`}>
          <Textarea
            value={settings.riskWording[level]}
            rows={2}
            onChange={(e) =>
              update({ riskWording: { ...settings.riskWording, [level]: e.target.value } })
            }
          />
        </FieldGroup>
      ))}
    </div>
  );
}

/* ---------- Per-section editor (center, a section selected) ---------- */

function SectionEditor({
  section,
  findings,
  exhibitCols,
  update,
  onDelete,
}: {
  section: WbSection;
  findings: Finding[];
  exhibitCols: number;
  update: (patch: Partial<WbSection>) => void;
  onDelete: () => void;
}) {
  const cats = availableCategories(findings);
  const selectedCats = section.categories ?? [];

  return (
    <div className="bld-editor">
      <div className="bld-editor-head">
        <Icon name={TYPE_ICON[section.type]} size={18} />
        <div>
          <h3>{SECTION_TYPE_LABEL[section.type]}</h3>
          <p>Configure how this section appears in the compiled workbook.</p>
        </div>
      </div>

      <FieldGroup label="Section title">
        <Input value={section.title} onChange={(e) => update({ title: e.target.value })} />
      </FieldGroup>

      {section.type === "findings" && (
        <>
          <div className="bld-sub-h">Categories in this section</div>
          <p className="bld-editor-note">
            Findings whose category is selected appear here. Their disposition + AI basis are
            derived from the Findings tab.
          </p>
          <div className="bld-cat-list">
            {cats.map((c) => {
              const on = selectedCats.includes(c);
              return (
                <label key={c} className={cn("bld-cat", on && "on")}>
                  <Switch
                    checked={on}
                    label={c}
                    onChange={(next) =>
                      update({
                        categories: next
                          ? [...selectedCats, c]
                          : selectedCats.filter((x) => x !== c),
                      })
                    }
                  />
                  <span>{c}</span>
                </label>
              );
            })}
          </div>
        </>
      )}

      {section.type === "exhibits" && (
        <>
          <FieldGroup label="Render as">
            <SegmentedControl
              options={[
                { value: "both", label: "Tables + charts" },
                { value: "table", label: "Tables only" },
                { value: "chart", label: "Charts only" },
              ]}
              value={section.exhibitMode ?? "both"}
              onChange={(v) => update({ exhibitMode: v as "table" | "chart" | "both" })}
            />
          </FieldGroup>
          <div className="bld-sub-h">Series</div>
          <ToggleRow
            label="Adjustment grid"
            hint="Sales-comparison $/SF adjustment table"
            checked={section.series?.adjustmentGrid ?? true}
            onChange={(v) =>
              update({ series: { ...defSeries(section), adjustmentGrid: v } })
            }
          />
          <ToggleRow
            label="$/SF by comparable"
            hint="Adjusted price-per-SF bar chart"
            checked={section.series?.psf ?? true}
            onChange={(v) => update({ series: { ...defSeries(section), psf: v } })}
          />
          <ToggleRow
            label="Cap-rate comparison"
            hint="Capitalization-rate number-line"
            checked={section.series?.capRate ?? true}
            onChange={(v) => update({ series: { ...defSeries(section), capRate: v } })}
          />
        </>
      )}

      {section.type === "sensitivity" && exhibitCols > 0 && (
        <FieldGroup label="Scenario range">
          <SegmentedControl
            options={[
              { value: "3", label: "Tightest 3" },
              { value: "5", label: "5 scenarios" },
              { value: String(exhibitCols), label: `All ${exhibitCols}` },
            ]}
            value={String(Math.min(section.sensitivityCols ?? exhibitCols, exhibitCols))}
            onChange={(v) => update({ sensitivityCols: Number(v) })}
          />
        </FieldGroup>
      )}

      {section.type === "freeText" && (
        <FieldGroup label="Body">
          <Textarea
            value={section.body ?? ""}
            rows={8}
            placeholder="Write the narrative. Merge fields like {{property}} are available."
            onChange={(e) => update({ body: e.target.value })}
          />
        </FieldGroup>
      )}

      {(section.type === "swot" || section.type === "freeText") && (
        <ToggleRow
          label="Place in appendix"
          hint="Number with a letter (Appendix A…) after the body sections"
          checked={!!section.appendix}
          onChange={(v) => update({ appendix: v })}
        />
      )}

      {(section.type === "conditions" || section.type === "returns") && (
        <p className="bld-auto-note">
          <Icon name="ai" size={14} />
          Auto-generated from finding dispositions on the Findings tab — it hides itself when
          there is nothing to list.
        </p>
      )}

      {(section.type === "summary" ||
        section.type === "conclusion" ||
        section.type === "certification") && (
        <p className="bld-auto-note">
          <Icon name="info" size={14} />
          Content is derived from the review — no per-section options. Use Document settings for
          branding and wording.
        </p>
      )}

      <div className="bld-editor-foot">
        <Button variant="ghost" size="sm" iconLeft="trash" onClick={onDelete}>
          Delete section
        </Button>
      </div>
    </div>
  );
}

function defSeries(section: WbSection) {
  return section.series ?? { adjustmentGrid: true, psf: true, capRate: true };
}

/* ---------- small editor primitives ---------- */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bld-field">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="bld-toggle">
      <div className="bld-toggle-txt">
        <span className="bld-toggle-l">{label}</span>
        <span className="bld-toggle-h">{hint}</span>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
