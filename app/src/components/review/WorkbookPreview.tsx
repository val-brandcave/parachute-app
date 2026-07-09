"use client";

import { useMemo } from "react";
import { Icon, ParachuteGlyph } from "@/components/atoms";
import { SeverityChip } from "@/components/molecules";
import {
  RECOMMENDATION_META,
  RISK_META,
  WB_THEMES,
  WB_FONTS,
  type Recommendation,
  type RiskRating,
  valueSummary,
  formatMoney,
  formatLongDate,
  dispTag,
  dispositionLine,
  aiBasisLine,
  actionItems,
  workbookHeader,
  WORKBOOK_FOOTER,
} from "@/lib/workbook";
import {
  visibleSensitivityCols,
  type WorkbookConfig,
  type WbSection,
  type WbFact,
} from "@/lib/workbook-config";
import {
  SectionShell,
  HiddenSectionStub,
  AddDivider,
  FactGridEditor,
  SectionDragGhost,
  useSectionDrag,
} from "./WorkbookSectionChrome";
import {
  AdjustmentTable,
  PsfBarChart,
  CapRateScale,
  SensitivityHeat,
  SwotGrid,
  GridCell,
} from "./WorkbookExhibits";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { availableCategories } from "@/lib/workbook-config";
import {
  EditableProse,
  ProvenancePip,
  WorkbookFindingBlock,
  type WorkbookEditingActions,
} from "./WorkbookInline";
import type { WorkbookSignature, WorkbookFiling } from "@/store/workspace.store";
import type { Finding, FindingState, Review, WorkbookExhibits } from "@/types";

/**
 * The compiled, branded, auditor-facing workbook document (§4.4) — the reviewer's
 * deliverable. Its CONTENT derives from the live workspace store (findings,
 * dispositions, conditions, returns, action items); its ORDER, VISIBILITY,
 * GROUPING, and PRESENTATION come from the per-review Builder config
 * (`WorkbookConfig`) — so the Workbook sub-view and the Builder's live mini-
 * preview render the exact same paper. A DRAFT ribbon + watermark sit over the
 * page until signed; the certification block then carries the SHA-256 seal.
 */
export function WorkbookPreview({
  review,
  findings,
  states,
  exhibits,
  config,
  recommendation,
  risk,
  reviewerName,
  reviewedAt,
  signature,
  filing,
  editing,
}: {
  review: Review;
  findings: Finding[];
  states: Record<string, FindingState>;
  exhibits: WorkbookExhibits | null;
  config: WorkbookConfig;
  recommendation: Recommendation;
  risk: RiskRating;
  reviewerName: string;
  reviewedAt: number;
  signature: WorkbookSignature | null;
  filing: WorkbookFiling | null;
  /** Inline-editing actions (Phase 2a — F-143/F-144). When set and the workbook
   *  is unsigned, findings render as live decision blocks, the comp grid gets
   *  row tools, and narratives edit in place. Omit for the read-only doc. */
  editing?: WorkbookEditingActions | null;
}) {
  const value = useMemo(() => valueSummary(review), [review]);
  const rec = RECOMMENDATION_META[recommendation];
  const riskMeta = RISK_META[risk];
  // A signed document is final — editing chrome never renders over the seal.
  const edit = signature ? null : editing ?? null;

  const { settings } = config;
  const accent = WB_THEMES[settings.theme]?.accent ?? WB_THEMES.Navy.accent;
  const headingFont = WB_FONTS[settings.headingFont]?.stack ?? WB_FONTS.display.stack;
  const riskWording = settings.riskWording[risk] || riskMeta.wording;

  const disp = (id: string) => states[id]?.disposition ?? "pending";
  // Removed findings are excluded from the workbook everywhere but retained for
  // the audit trail (F-118). `removed` powers an optional "excluded" footnote.
  const removed = findings.filter((f) => disp(f.id) === "removed");
  const conditions = findings.filter(
    (f) => states[f.id]?.condition && disp(f.id) !== "removed",
  );
  const returned = settings.hideRejected
    ? []
    : findings.filter((f) => disp(f.id) === "rejected");
  const actions = actionItems(findings, states);

  // Which dispositions belong in the findings body (rejected go to "Returned";
  // overridden can be hidden via settings).
  const bodyDisps = settings.hideOverridden
    ? ["accepted", "pending"]
    : ["accepted", "edited", "pending"];

  // On-canvas drag-to-reorder (section chrome). The hook is inert until a
  // handle starts a drag; drops route to the host's moveSectionBefore. While
  // dragging, a spring-following ghost chip carries the section in hand.
  const { dragId, dropId, startDrag, ghostX, ghostY } = useSectionDrag((id, beforeId) => {
    editing?.onMoveSectionBefore(id, beforeId);
  });

  // Build each enabled section to a node (null = auto section with no content,
  // skipped without consuming a number). In edit mode, HIDDEN sections stay in
  // the flow as slim stubs so Hide is reversible on the canvas.
  const built = config.sections
    .filter((s) => s.enabled || !!edit)
    .map((s) => ({ s, stub: !s.enabled, node: s.enabled ? buildNode(s) : null }))
    .filter((b) => b.stub || b.node !== null);

  function buildNode(s: WbSection): React.ReactNode {
    switch (s.type) {
      case "summary": {
        // Fact tiles derive from the review record until first edited — the
        // first edit MATERIALIZES them onto the section (plan §4.1).
        const derivedFacts: WbFact[] = [
          { label: "Concluded Market Value", value: formatMoney(value.concludedValue), big: true },
          { label: "Effective Date", value: formatLongDate(value.effectiveDate) },
          { label: "Loan Amount", value: formatMoney(value.loanAmount) },
          { label: "Loan-to-Value", value: `${Math.round(value.ltv * 100)}%` },
          { label: "Property Rights", value: value.rights },
          { label: "Property Type", value: review.propertyType },
        ];
        const facts = s.facts ?? derivedFacts;
        const approaches = s.approaches ?? value.approaches;
        const commitApproaches = (next: string[]) =>
          edit?.onUpdateSection(s.id, { approaches: next, edited: prov(reviewerName) });
        return (
          <>
            {s.edited && !edit && (
              <ProvenancePip label="Edited by reviewer" by={s.edited.by} at={s.edited.at} />
            )}
            {edit ? (
              <FactGridEditor
                facts={facts}
                onCommit={(next) =>
                  edit.onUpdateSection(s.id, { facts: next, edited: prov(reviewerName) })
                }
              />
            ) : (
              <div className="wb-facts">
                {facts.map((f, i) => (
                  <Fact key={i} label={f.label} value={f.value} big={f.big} />
                ))}
              </div>
            )}
            <div className="wb-approaches">
              <span className="wb-mini-label">Approaches developed</span>
              <div className="wb-tags">
                {approaches.map((a, i) =>
                  edit ? (
                    <span key={`${i}-${a}`} className="wb-tag wb-tag--edit">
                      <GridCell
                        raw={a}
                        display={a}
                        onCommit={(v) =>
                          commitApproaches(
                            v.trim()
                              ? approaches.map((x, j) => (j === i ? v.trim() : x))
                              : approaches.filter((_, j) => j !== i),
                          )
                        }
                      />
                      <button
                        className="wb-rowdel"
                        onClick={() => commitApproaches(approaches.filter((_, j) => j !== i))}
                        aria-label={`Remove ${a}`}
                        title="Remove approach"
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    </span>
                  ) : (
                    <span key={a} className="wb-tag">
                      {a}
                    </span>
                  ),
                )}
                {edit && (
                  <button
                    className="wb-tag wb-tag--add"
                    onClick={() => commitApproaches([...approaches, "New approach"])}
                  >
                    <Icon name="add" size={12} /> Add
                  </button>
                )}
              </div>
            </div>
          </>
        );
      }

      case "findings": {
        const cats = s.categories ?? [];
        const items = findings.filter(
          (f) => cats.includes(f.category) && bodyDisps.includes(disp(f.id)),
        );
        if (!items.length && !edit)
          return (
            <p className="wb-prose wb-muted">No findings fall under this section.</p>
          );
        // Inline editing: every finding is a live decision block in the document
        // (Concur / Edit / Reject / Delete where it stands — F-143). The chapter
        // foot carries "＋ Add finding" — a finding belongs to a chapter, so the
        // composer pre-fills THIS section's categories (F-145).
        if (edit)
          return (
            <>
              {!items.length && (
                <p className="wb-prose wb-muted">
                  No findings fall under this section yet.
                </p>
              )}
              {items.map((f) => (
                <WorkbookFindingBlock
                  key={f.id}
                  f={f}
                  state={states[f.id]}
                  property={review.propertyAddress}
                  reviewerName={reviewerName}
                  actions={edit}
                />
              ))}
              <button className="wb-addrow" onClick={() => edit.onRequestAddFinding(s.id)}>
                <Icon name="add" size={13} /> Add finding
              </button>
            </>
          );
        return (
          <>
            {items.map((f) =>
              disp(f.id) === "pending" ? (
                <OpenPlaceholder key={f.id} f={f} />
              ) : (
                <FindingEntry
                  key={f.id}
                  f={f}
                  state={states[f.id]}
                  showStatus={settings.showStatus}
                  showConfidence={settings.showConfidence}
                  coded={settings.colorCoding}
                />
              ),
            )}
          </>
        );
      }

      case "exhibits": {
        if (!exhibits) return null;
        const series = s.series ?? { adjustmentGrid: true, psf: true, capRate: true };
        const mode = s.exhibitMode ?? "both";
        const showTable = series.adjustmentGrid && mode !== "chart";
        const showPsf = series.psf && mode !== "table";
        const showCap = series.capRate && mode !== "table";
        if (!showTable && !showPsf && !showCap)
          return <p className="wb-prose wb-muted">All exhibit series are hidden.</p>;
        // The $/SF chart DERIVES from the adjustment grid, so row edits flow
        // straight into the exhibit (only the concluded bar is kept from seed).
        const psf = {
          ...exhibits.psf,
          bars: [
            ...exhibits.adjustmentGrid.map((r) => ({
              label: r.comp.replace(/^Comparable\s+/i, "Comp "),
              value: Math.round(r.adj),
            })),
            ...exhibits.psf.bars.filter((b) => b.concluded),
          ],
        };
        return (
          <>
            {showTable && (
              <>
                <div className="wb-exh-h">Sales comparison adjustment grid</div>
                <AdjustmentTable
                  rows={exhibits.adjustmentGrid}
                  tools={
                    edit
                      ? {
                          onAdd: edit.onAddCompRow,
                          onDelete: edit.onDeleteCompRow,
                          onUpdate: edit.onUpdateCompRow,
                        }
                      : null
                  }
                />
                <p className="wb-exh-note" style={{ marginBottom: 14 }}>
                  Abbreviated grid — the full grid appears in the appraisal (p.47).
                </p>
              </>
            )}
            {showPsf && <PsfBarChart psf={psf} />}
            {showCap && (
              <CapRateScale
                cap={exhibits.capRate}
                tools={edit ? { onUpdate: edit.onUpdateCapRate } : null}
              />
            )}
          </>
        );
      }

      case "sensitivity": {
        if (!exhibits) return null;
        const n = s.sensitivityCols ?? exhibits.sensitivity.cols.length;
        const cols = visibleSensitivityCols(exhibits.sensitivity.cols, n);
        return <SensitivityHeat sens={{ ...exhibits.sensitivity, cols }} />;
      }

      case "conditions":
        if (!conditions.length) return null;
        return (
          <>
            <p className="wb-prose">
              Approval is recommended subject to the following condition
              {conditions.length === 1 ? "" : "s"} being satisfied prior to funding:
            </p>
            <ol className="wb-conditions">
              {conditions.map((f, i) => (
                <li key={f.id}>
                  <span className="wb-cond-id">C{i + 1}</span>
                  <div>
                    <div className="wb-cond-text">
                      {states[f.id]?.reason || states[f.id]?.comment || f.question}
                    </div>
                    <div className="wb-cond-src">
                      {f.category} · p.{f.page}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </>
        );

      case "returns":
        if (!returned.length) return null;
        return (
          <>
            <p className="wb-prose">
              The following {returned.length === 1 ? "item is" : `${returned.length} items are`}{" "}
              returned to {review.appraisalFirm} for revision and resubmission:
            </p>
            <ol className="wb-returns">
              {returned.map((f, i) => (
                <li key={f.id}>
                  <div className="wb-ret-top">
                    <span className="wb-ret-n">Item {i + 1}</span>
                    <SeverityChip severity={f.severity} />
                    <span className="wb-ret-page">p.{f.page}</span>
                  </div>
                  <div className="wb-ret-q">{f.question}</div>
                  <div className="wb-ret-reason">{dispositionLine(states[f.id])}</div>
                  {edit && (
                    <button
                      className="wb-fblock-undo"
                      onClick={() => edit.onDisposition(f.id, "pending")}
                    >
                      Undo — back to open
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </>
        );

      case "conclusion": {
        // The reviewer's in-place rewrite (s.body) overrides the derived
        // narrative; until then the derived sentence renders (and seeds the
        // editor as plain text when clicked).
        const derived = `Based on the technical review of the appraisal of ${review.propertyAddress} prepared by ${review.appraisalFirm}, the reviewer’s recommendation is ${rec.label.toLowerCase()}. ${riskWording}`;
        const conclusionProse = s.body ? (
          <p className="wb-prose">{s.body}</p>
        ) : (
          <p className="wb-prose">
            Based on the technical review of the appraisal of <b>{review.propertyAddress}</b>{" "}
            prepared by {review.appraisalFirm}, the reviewer&rsquo;s recommendation is{" "}
            <b>{rec.label.toLowerCase()}</b>. {riskWording}
          </p>
        );
        return (
          <>
            {edit ? (
              <EditableProse
                text={s.body ?? derived}
                display={conclusionProse}
                edited={s.edited}
                onCommit={(t) => edit.onUpdateSection(s.id, { body: t, edited: prov(reviewerName) })}
              />
            ) : (
              <>
                {s.edited && (
                  <ProvenancePip label="Edited by reviewer" by={s.edited.by} at={s.edited.at} />
                )}
                {conclusionProse}
              </>
            )}
            {actions.length > 0 ? (
              <ol className="wb-actions-list">
                {actions.map((a) => (
                  <li key={a.id}>
                    <span className="wb-act-id">{a.id}</span>
                    <span className="wb-act-text">{a.text}</span>
                    <span className="wb-act-due">{a.deadline}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="wb-prose wb-muted">
                No outstanding action items — all findings were reconciled without conditions.
              </p>
            )}
            {removed.length > 0 && (
              <div className="wb-excluded">
                <p className="wb-prose wb-muted wb-excluded-note">
                  {removed.length} finding{removed.length === 1 ? "" : "s"} {removed.length === 1 ? "was" : "were"}{" "}
                  reviewed and excluded from this workbook as not material to the value conclusion;{" "}
                  {removed.length === 1 ? "it is" : "they are"} retained in the review audit log.
                </p>
                {edit && (
                  <ul className="wb-excluded-list">
                    {removed.map((f) => (
                      <li className="wb-excluded-item" key={f.id}>
                        <Icon name="reject" size={13} className="wb-excluded-ic" />
                        <span className="wb-excluded-q">{f.question}</span>
                        <button
                          className="wb-excluded-restore"
                          onClick={() => edit.onRestoreFinding(f.id)}
                          title="Bring this finding back into the workbook"
                        >
                          <Icon name="undo" size={12} /> Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        );
      }

      case "swot":
        if (!exhibits) return null;
        return <SwotGrid swot={exhibits.swot} onUpdateQuadrant={edit ? edit.onUpdateSwot : null} />;

      case "freeText":
        return (
          <>
            {s.imported && (
              <div className="wb-import-tag">
                <Icon name="download" size={12} /> Imported from the appraisal report
              </div>
            )}
            {edit ? (
              <EditableProse
                text={s.body ?? ""}
                display={
                  s.body ? undefined : (
                    <span className="wb-muted">Empty narrative — click to write it here.</span>
                  )
                }
                edited={s.edited}
                onCommit={(t) => edit.onUpdateSection(s.id, { body: t, edited: prov(reviewerName) })}
              />
            ) : s.body ? (
              <>
                {s.edited && (
                  <ProvenancePip label="Edited by reviewer" by={s.edited.by} at={s.edited.at} />
                )}
                <p className="wb-prose">{s.body}</p>
              </>
            ) : (
              <p className="wb-prose wb-muted">
                Empty narrative — add body text in the Builder.
              </p>
            )}
          </>
        );

      case "certification":
        return (
          <>
            <p className="wb-prose wb-cert-stmt">
              I certify that I have reviewed the referenced appraisal in accordance with USPAP
              Standard 3 and the policies of {review.bank}, and that the analysis, opinions, and
              conclusions expressed in this review are my own professional judgment.
            </p>
            {signature ? (
              <div className="wb-sig">
                <div className="wb-sig-mark" style={{ fontFamily: headingFont }}>
                  {signature.name}
                </div>
                <div className="wb-sig-name">
                  {signature.name}
                  <span>{signature.designation}</span>
                </div>
                <div className="wb-sig-meta">
                  <span>
                    <Icon name="check-circle" size={13} /> Signed {formatLongDate(signature.at)}
                  </span>
                  <span className="wb-sig-sha" title={signature.sha}>
                    <Icon name="sso" size={13} /> SHA-256 {signature.sha.slice(0, 16)}…
                  </span>
                </div>
              </div>
            ) : (
              <div className="wb-sig wb-sig--empty">
                <div className="wb-sig-line" />
                <div className="wb-sig-pending">
                  <Icon name="clock" size={14} /> Awaiting reviewer signature
                </div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  }

  const draft = !signature;
  const scaleClass =
    settings.scale === "compact"
      ? " wb-doc--compact"
      : settings.scale === "spacious"
        ? " wb-doc--spacious"
        : "";

  // Rough per-section height as a fraction of one Letter sheet — used to pack
  // sections onto pages so the doc reads as a real multi-page PDF. Deterministic
  // (no DOM measuring), so it's SSR-safe and re-packs when sections are toggled.
  function estimateWeight(s: WbSection): number {
    switch (s.type) {
      case "summary":
        return 0.5;
      case "findings": {
        const cats = s.categories ?? [];
        const items = findings.filter(
          (f) => cats.includes(f.category) && bodyDisps.includes(disp(f.id)),
        );
        // Live finding blocks carry a decision bar, so they run taller.
        return 0.16 + items.length * (edit ? 0.2 : 0.14);
      }
      case "exhibits":
        return 0.78;
      case "sensitivity":
        return 0.42;
      case "swot":
        return 0.5;
      case "conditions":
        return 0.16 + conditions.length * 0.1;
      case "returns":
        return 0.16 + returned.length * 0.15;
      case "conclusion":
        return 0.32 + actions.length * 0.07;
      case "freeText":
        return 0.3;
      case "certification":
        return 0.5;
      default:
        return 0.3;
    }
  }

  // Number sections (body 1..N, appendices A, B…) and weight each — same order
  // the Builder's list labels use. Stubs don't consume a number.
  let num = 0;
  let appx = 0;
  const labeled = built.map(({ s, node, stub }) => ({
    s,
    node,
    stub,
    label: stub
      ? ""
      : s.appendix
        ? `Appendix ${String.fromCharCode(65 + appx++)}`
        : String(++num),
    weight: stub ? 0.1 : estimateWeight(s),
  }));
  type LabeledSection = (typeof labeled)[number];

  // Greedy weight-packing into content pages (cover is page 1; content from 2).
  // Budget runs ahead of 1.0 because the weights estimate conservatively — this
  // keeps sections flowing onto a sheet until it's genuinely full (fewer, fuller
  // pages) rather than breaking early and leaving the bottom empty.
  const PAGE_BUDGET = 1.7;
  const pages: LabeledSection[][] = [];
  let cur: LabeledSection[] = [];
  let sum = 0;
  for (const it of labeled) {
    if (cur.length && sum + it.weight > PAGE_BUDGET) {
      pages.push(cur);
      cur = [];
      sum = 0;
    }
    cur.push(it);
    sum += it.weight;
  }
  if (cur.length) pages.push(cur);

  // Front matter is TWO pages now (D7): page 1 = cover, page 2 = contents.
  // Content sheets therefore start at page 3. If there are no sections, the
  // contents page is skipped and content (none) would start at page 2.
  const hasToc = pages.length > 0;
  const coverPages = hasToc ? 2 : 1;
  const totalPages = coverPages + pages.length;

  // Contents list — each rendered section to its 1-based page number (hidden
  // stubs never print, so they stay out of the contents).
  const toc = pages.flatMap((pg, pi) =>
    pg
      .filter((it) => !it.stub)
      .map((it) => ({
        id: it.s.id,
        label: it.label,
        title: it.s.title,
        appendix: !!it.s.appendix,
        pageNo: pi + coverPages + 1,
      })),
  );
  const tocSections = toc.filter((it) => !it.appendix);
  const tocAppendices = toc.filter((it) => it.appendix);

  // Chrome context: which types exist (singletons drop out of the add palette),
  // the last shell (end-of-document drop target), and per-TYPE toolbar extras —
  // the §5 matrix rendered from the capability registry.
  const presentTypes = config.sections.map((s) => s.type);
  const lastShellId = [...labeled].reverse().find((it) => !it.stub)?.s.id;
  const EXHIBIT_MODES = ["both", "table", "chart"] as const;
  const extrasFor = (s: WbSection): React.ReactNode => {
    if (!edit) return null;
    if (s.type === "findings") {
      // Which categories roll into this chapter — a checkbox menu over every
      // category in the review (stays open while toggling; doc re-renders live).
      const current = s.categories ?? [];
      const all = Array.from(new Set([...availableCategories(findings), ...current]));
      return (
        <ActionMenu
          menuClassName="wb-adddiv-menu"
          items={all.map((cat) => ({
            label: cat,
            selected: current.includes(cat),
            keepOpen: true,
            onClick: () =>
              edit.onUpdateSection(s.id, {
                categories: current.includes(cat)
                  ? current.filter((c) => c !== cat)
                  : [...current, cat],
              }),
          }))}
          trigger={({ open, toggle }) => (
            <button
              className={`wb-shell-act${open ? " is-open" : ""}`}
              onClick={toggle}
              title="Which finding categories roll into this chapter"
            >
              <Icon name="checklist" size={12} /> Categories
            </button>
          )}
        />
      );
    }
    if (s.type === "exhibits") {
      const mode = s.exhibitMode ?? "both";
      const next = EXHIBIT_MODES[(EXHIBIT_MODES.indexOf(mode) + 1) % EXHIBIT_MODES.length];
      const modeLabel =
        mode === "both" ? "Table + chart" : mode === "table" ? "Table only" : "Chart only";
      return (
        <button
          className="wb-shell-act"
          onClick={() => edit.onUpdateSection(s.id, { exhibitMode: next })}
          title="Cycle what this exhibit shows: table / chart / both"
        >
          <Icon name="columns" size={12} /> {modeLabel}
        </button>
      );
    }
    if (s.type === "sensitivity" && exhibits) {
      const total = exhibits.sensitivity.cols.length;
      const n = Math.min(s.sensitivityCols ?? total, total);
      return (
        <span className="wb-shell-step">
          <button
            className="wb-shell-act"
            onClick={() => edit.onUpdateSection(s.id, { sensitivityCols: Math.max(3, n - 1) })}
            disabled={n <= 3}
            aria-label="Fewer scenario columns"
          >
            <Icon name="minus" size={12} />
          </button>
          {n} cols
          <button
            className="wb-shell-act"
            onClick={() => edit.onUpdateSection(s.id, { sensitivityCols: Math.min(total, n + 1) })}
            disabled={n >= total}
            aria-label="More scenario columns"
          >
            <Icon name="add" size={12} />
          </button>
        </span>
      );
    }
    return null;
  };

  const runHead = settings.showHeader ? (
    <div className="wb-runhead">
      <span className="wb-runhead-org">
        {settings.showLogo && <Icon name="org" size={14} />}
        {workbookHeader(review.bank)}
      </span>
      <span className="wb-runhead-doc">Technical Review Workbook</span>
    </div>
  ) : null;

  return (
    <article
      className={`wb-doc${draft ? " is-draft" : ""}${scaleClass}`}
      style={{ "--wb-accent": accent, "--wb-head": headingFont } as React.CSSProperties}
    >
      {filing && (
        <div className={`wb-filebar wb-filebar--${filing}`}>
          <Icon name={filing === "filed" ? "check-circle" : "undo"} size={16} />
          {filing === "filed"
            ? "Filed — workbook delivered to the lender and locked."
            : `Returned to ${review.appraisalFirm} with the revision letter.`}
        </div>
      )}

      {/* PAGE 1 — full-bleed branded cover (D7: cover is its own page) */}
      <section className="wb-page wb-page--cover">
        {draft && <div className="wb-ribbon">Draft</div>}
        <span className="wb-cover-mark" aria-hidden="true">
          <ParachuteGlyph size={420} />
        </span>

        <div className="wb-cover-top">
          <span className="wb-cover-brand">
            <ParachuteGlyph size={22} /> Parachute
          </span>
          <span className="wb-cover-conf">Confidential</span>
        </div>

        <div className="wb-cover-main">
          <div className="wb-cover-eyebrow">Technical Review Workbook</div>
          <h1 className="wb-cover-title" style={{ fontFamily: headingFont }}>
            {review.propertyAddress}
          </h1>
          <div className="wb-cover-sub">
            {review.propertyType} · Appraisal by {review.appraisalFirm} · Prepared for{" "}
            {review.bank}
          </div>

          <div className="wb-band-bars wb-cover-bars">
            <div className={`wb-pill wb-rec-pill wb-rec-pill--${rec.tone}`}>
              <Icon
                name={
                  rec.tone === "pass" ? "check-circle" : rec.tone === "flag" ? "checklist" : "clock"
                }
                size={16}
              />
              <span className="wb-pill-text">
                Reviewer recommendation: <b>{rec.label}</b>
                {conditions.length > 0 && rec.tone !== "info" && (
                  <span className="wb-rec-count">
                    {conditions.length} condition{conditions.length === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            </div>
            <div className={`wb-pill wb-risk-pill wb-risk-pill--${risk}`}>
              <Icon name="info" size={16} />
              <span className="wb-pill-text">
                <b>Risk: {riskMeta.label.replace(" Risk", "")}</b>
                <span className="wb-risk-word">{riskWording}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="wb-cover-bottom">
          <div className="wb-band-meta">
            <Meta label="Loan #" value={review.loanNo} />
            <Meta label="Effective Date" value={formatLongDate(value.effectiveDate)} />
            <Meta label="Reviewer" value={reviewerName} />
            <Meta label="Reviewed" value={formatLongDate(reviewedAt)} />
          </div>
          <div className="wb-page-foot wb-page-foot--cover">
            {settings.showFooter && <span>{WORKBOOK_FOOTER}</span>}
            <span className="wb-page-foot-n">Page 1 of {totalPages}</span>
          </div>
        </div>
      </section>

      {/* PAGE 2 — contents, its own page, grouped Sections / Appendices */}
      {hasToc && (
        <section className="wb-page wb-page--toc">
          {runHead}
          <div className="wb-toc-page">
            <div className="wb-toc-page-h" style={{ fontFamily: headingFont }}>
              Contents
            </div>
            {tocSections.length > 0 && (
              <>
                <div className="wb-toc-group">Sections</div>
                <ol className="wb-toc">
                  {tocSections.map((it) => (
                    <li key={it.id} className="wb-toc-row">
                      <span className="wb-toc-n" style={{ fontFamily: "var(--wb-head)" }}>
                        {it.label}
                      </span>
                      <span className="wb-toc-title">{it.title}</span>
                      <span className="wb-toc-dots" aria-hidden="true" />
                      <span className="wb-toc-pg">{it.pageNo}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {tocAppendices.length > 0 && (
              <>
                <div className="wb-toc-group">Appendices</div>
                <ol className="wb-toc">
                  {tocAppendices.map((it) => (
                    <li key={it.id} className="wb-toc-row">
                      <span className="wb-toc-n" style={{ fontFamily: "var(--wb-head)" }}>
                        {it.label.replace("Appendix ", "")}
                      </span>
                      <span className="wb-toc-title">{it.title}</span>
                      <span className="wb-toc-dots" aria-hidden="true" />
                      <span className="wb-toc-pg">{it.pageNo}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
          <div className="wb-page-foot">
            {settings.showFooter && <span>{WORKBOOK_FOOTER}</span>}
            <span className="wb-page-foot-n">Page 2 of {totalPages}</span>
          </div>
        </section>
      )}

      {/* Drag ghost — the section "in hand", trailing the pointer */}
      {dragId &&
        (() => {
          const it = labeled.find((l) => l.s.id === dragId);
          return it ? (
            <SectionDragGhost label={it.label} title={it.s.title} x={ghostX} y={ghostY} />
          ) : null;
        })()}

      {/* Content pages — sections packed onto Letter sheets. In edit mode each
          section wears the canvas chrome (outline + toolbar + drag handle) with
          an insert divider before it; hidden sections render as stubs. */}
      {pages.map((pg, pi) => (
        <section className="wb-page" key={`pg-${pi}`}>
          {runHead}
          <div className="wb-page-body">
            {pg.map(({ s, node, label, stub }) => {
              if (!edit)
                return (
                  <Section key={s.id} id={s.id} label={label} title={s.title}>
                    {node}
                  </Section>
                );
              if (stub)
                return (
                  <div key={s.id}>
                    <AddDivider beforeId={s.id} presentTypes={presentTypes} edit={edit} />
                    <HiddenSectionStub
                      sec={s}
                      dropBefore={dropId === s.id}
                      onShow={() => edit.onToggleSection(s.id)}
                    />
                  </div>
                );
              return (
                <div key={s.id}>
                  <AddDivider beforeId={s.id} presentTypes={presentTypes} edit={edit} />
                  <SectionShell
                    sec={s}
                    label={label}
                    edit={edit}
                    dragging={dragId === s.id}
                    dropBefore={dropId === s.id}
                    dropAfter={dropId === "__end__" && s.id === lastShellId}
                    onHandleDown={startDrag(s.id)}
                    extras={extrasFor(s)}
                  >
                    {node}
                  </SectionShell>
                </div>
              );
            })}
            {edit && pi === pages.length - 1 && (
              <AddDivider beforeId={null} presentTypes={presentTypes} edit={edit} />
            )}
          </div>
          <div className="wb-page-foot">
            {settings.showFooter && <span>{WORKBOOK_FOOTER}</span>}
            <span className="wb-page-foot-n">
              Page {pi + coverPages + 1} of {totalPages}
            </span>
          </div>
        </section>
      ))}
    </article>
  );
}

/* ---- section + small presentational helpers ---- */

/** Provenance stamp for an in-place content edit — called from commit handlers
 *  only (never during render). */
function prov(by: string) {
  return { by, at: Date.now() };
}

function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="wb-sec" id={`wb-sec-${id}`}>
      <h3 className="wb-sec-h" style={{ fontFamily: "var(--wb-head)" }}>
        <span className="wb-sec-n">{label}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`wb-fact${big ? " wb-fact--big" : ""}`}>
      <span className="wb-fact-l">{label}</span>
      <span className="wb-fact-v">{value}</span>
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

function FindingEntry({
  f,
  state,
  showStatus,
  showConfidence,
  coded,
}: {
  f: Finding;
  state: FindingState;
  showStatus: boolean;
  showConfidence: boolean;
  coded: boolean;
}) {
  const tag = dispTag(state.disposition);
  return (
    <div className={`wb-find${coded ? ` wb-find--${f.severity}` : ""}`}>
      <div className="wb-find-top">
        <span className="wb-find-q">{f.question}</span>
        {showStatus && (
          <span className={`wb-tag-disp wb-tag-disp--${tag.tone}`}>
            <Icon
              name={tag.tone === "pass" ? "check-circle" : tag.tone === "fail" ? "x-circle" : "edit"}
              size={12}
            />
            {tag.label}
          </span>
        )}
      </div>
      <p className="wb-find-resp">{dispositionLine(state)}</p>
      {state.comment && <p className="wb-find-comment">Reviewer note: {state.comment}</p>}
      {showConfidence && <div className="wb-find-ai">{aiBasisLine(f)}</div>}
    </div>
  );
}

function OpenPlaceholder({ f }: { f: Finding }) {
  return (
    <div className="wb-open">
      <Icon name="clock" size={15} />
      <div>
        <div className="wb-open-q">{f.question}</div>
        <div className="wb-open-meta">
          Open — awaiting reviewer disposition · {f.category} · p.{f.page}
        </div>
      </div>
    </div>
  );
}
