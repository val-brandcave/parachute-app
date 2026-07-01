"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon } from "@/components/atoms";
import { ActionMenu, FindingDecisionBar } from "@/components/molecules";
import { useWorkspaceStore, useTemplatesStore, type RunReviewType } from "@/store";
import { buildAppraisalDoc, type DocBlock, type DocRun } from "@/data/appraisal-doc";
import { valueSummary, formatLongDate, auditStages } from "@/lib/workbook";
import type { Finding, FindingState, Review, Severity, ResponseTemplate } from "@/types";

const SEV_META: Record<Severity, { label: string; tone: string; color: string }> = {
  crit: { label: "Critical", tone: "crit", color: "var(--md-crit)" },
  fail: { label: "Fail", tone: "fail", color: "var(--md-error)" },
  flag: { label: "Flag", tone: "flag", color: "var(--md-warn)" },
  pass: { label: "Clean", tone: "pass", color: "var(--md-success)" },
  na: { label: "N/A", tone: "na", color: "var(--md-outline)" },
};

/** Exceptions-first ordering: criticals/fails first, then by ascending confidence. */
function rank(f: Finding) {
  const sevRank = { crit: 0, fail: 1, flag: 2, na: 3, pass: 4 }[f.severity];
  return sevRank * 100 + f.confidence * 10;
}

/** Base page width (px) at 100%; zoom scales it (text stays crisp, reflows). */
const PAGE_W = 760;

/** Vector PDFs (the default) pin the finding number INLINE on the highlighted
 *  span. The measured right-margin tag column is the scanned/OCR-PDF fallback
 *  only (F-118/D8/F4) — kept behind this flag until rasterized sources land. */
const SCANNED = false;

/**
 * S-B Exceptions — the proofing view. The ORIGINAL appraisal is the hero: a
 * continuous scroll of white Letter pages (a real third-party PDF, so the paper
 * is always white regardless of app theme). The AI's findings are pinned directly
 * onto the document — the cited span is highlighted inline (severity-coloured) and
 * a numbered tag sits in the right margin beside it, synced to the thread on the
 * right. Selecting a finding (tag, highlight, or thread row) scrolls to and
 * focuses its highlight; Agree / Override / Flag write back to the workbook live.
 */
export function RunExceptions({
  review,
  reviewType = "technical",
  onBack,
}: {
  review: Review;
  /** Which review type this findings surface belongs to (scope only). */
  reviewType?: RunReviewType;
  onBack: () => void;
}) {
  const { findings, states, setDisposition, setComment, toggleCondition, toggleFlag } =
    useWorkspaceStore();
  const workbookDirty = useWorkspaceStore((s) => s.workbookDirty);
  const regenerate = useWorkspaceStore((s) => s.regenerate);
  const responses = useTemplatesStore((s) => s.responses);

  const exceptions = useMemo(() => [...findings].sort((a, b) => rank(a) - rank(b)), [findings]);
  const numberOf = useMemo(() => {
    const m: Record<string, number> = {};
    exceptions.forEach((f, i) => (m[f.id] = i + 1));
    return m;
  }, [exceptions]);
  const findingById = useMemo(
    () => Object.fromEntries(findings.map((f) => [f.id, f])) as Record<string, Finding>,
    [findings],
  );

  // The appraisal document, with the review's identity woven into the cover/
  // transmittal so it's cohesive with the rest of the run.
  const value = useMemo(() => valueSummary(review), [review]);
  const doc = useMemo(
    () =>
      buildAppraisalDoc({
        address: review.propertyAddress,
        propertyType: review.propertyType,
        firm: review.appraisalFirm,
        bank: review.bank,
        loanNo: review.loanNo,
        effectiveDate: formatLongDate(value.effectiveDate),
        reportDate: formatLongDate(review.orderedAt),
      }),
    [review, value],
  );

  // Appraisal-firm letterhead bits (monogram initials + a slug for the email).
  const firmInitials = useMemo(
    () =>
      review.appraisalFirm
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
    [review.appraisalFirm],
  );
  const firmSlug = useMemo(
    () => review.appraisalFirm.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""),
    [review.appraisalFirm],
  );

  // Which page each anchored finding sits on (for the gutter-tag layer).
  const anchorsByPage = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const p of doc) {
      for (const b of p.blocks) {
        const runs = b.type === "p" || b.type === "note" ? b.runs : [];
        for (const r of runs) if (r.anchor) (map[p.n] ??= []).push(r.anchor);
      }
    }
    return map;
  }, [doc]);

  // `picked` is null until the user selects; the effective selection defaults to
  // the top exception (derived in render — no effect, no cascading setState).
  const [picked, setPicked] = useState<string | null>(null);
  const selectedId = picked ?? exceptions[0]?.id ?? null;
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  // Measured vertical offset (within its page) of each anchor's highlight, so the
  // gutter tag aligns to the cited line. Re-measured on zoom + container resize.
  const [tagTops, setTagTops] = useState<Record<string, number>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLElement | null>>({});

  // Measure anchor offsets for gutter-tag placement.
  const measure = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    const next: Record<string, number> = {};
    for (const fid of Object.values(anchorsByPage).flat()) {
      const el = sc.querySelector<HTMLElement>(`#anno-${fid}`);
      if (el) next[fid] = el.offsetTop;
    }
    setTagTops(next);
  };
  useLayoutEffect(() => {
    measure();
    const sc = scrollRef.current;
    if (!sc || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(sc);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, zoom]);

  const selectFinding = (id: string) => {
    setPicked(id);
    const el = scrollRef.current?.querySelector<HTMLElement>(`#anno-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Bulk action — accept every finding that hasn't been decided yet (leaves
  // any already overridden/flagged untouched).
  const agreeAll = () => {
    findings.forEach((f) => {
      if ((states[f.id]?.disposition ?? "pending") === "pending") {
        setDisposition(f.id, "accepted");
      }
    });
  };

  // Track which page is in view → the page counter.
  const onScroll = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    const top = sc.getBoundingClientRect().top;
    let cur = 1;
    for (const p of doc) {
      const el = pageRefs.current[p.n];
      if (el && el.getBoundingClientRect().top - top <= 120) cur = p.n;
    }
    setPage(cur);
  };
  const goPage = (n: number) => {
    pageRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const zoomBy = (d: number) => setZoom((z) => Math.min(1.5, Math.max(0.7, +(z + d).toFixed(2))));

  /* ---- document rendering ---- */

  const renderRun = (r: DocRun, key: number) => {
    if (!r.anchor || !findingById[r.anchor]) return <Fragment key={key}>{r.text}</Fragment>;
    const f = findingById[r.anchor];
    const tone = SEV_META[f.severity].tone;
    const active = selectedId === r.anchor;
    return (
      <mark
        key={key}
        id={`anno-${r.anchor}`}
        className={`run-anno run-anno--${tone}${active ? " active" : ""}`}
        onClick={() => selectFinding(r.anchor!)}
      >
        <span className={`run-anno-badge run-anno-badge--${tone}`} aria-hidden="true">
          {numberOf[r.anchor]}
        </span>
        {r.text}
      </mark>
    );
  };

  const renderBlock = (b: DocBlock, i: number) => {
    switch (b.type) {
      case "h":
        return (
          <h3 className="run-doc-h" key={i}>
            {b.text}
          </h3>
        );
      case "p":
        return (
          <p className="run-doc-p" key={i}>
            {b.runs.map(renderRun)}
          </p>
        );
      case "note":
        return (
          <p className="run-doc-note" key={i}>
            {b.runs.map(renderRun)}
          </p>
        );
      case "facts":
        return (
          <dl className="run-doc-facts" key={i}>
            {b.rows.map(([k, v], j) => (
              <div key={j} className="run-doc-fact">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        );
      case "table":
        return (
          <figure className="run-doc-tablewrap" key={i}>
            {b.caption && <figcaption className="run-doc-cap">{b.caption}</figcaption>}
            <table className="run-doc-table">
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} className={j === 0 ? "is-label" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={ci === 0 ? "is-label" : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {b.note && <p className="run-doc-tnote">{b.note}</p>}
          </figure>
        );
      case "figure":
        return (
          <div className="run-doc-figure" key={i}>
            <Icon name="pdf" size={30} />
            <span className="run-doc-figure-label">{b.label}</span>
            <span className="run-doc-figure-cap">{b.caption}</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!exceptions.length) {
    return <div className="run-loading text-secondary">No findings to review.</div>;
  }

  return (
    <div className="run-ex" data-review-type={reviewType}>
      {/* ---- Document viewer (hero) ---- */}
      <div className="run-ex-doc">
        <div className="run-ex-bar">
          <span className="run-ex-doc-meta">
            <Icon name="pdf" size={15} /> Source appraisal
            <span className="run-ex-doc-firm"> · {review.appraisalFirm}</span>
          </span>
          <div className="run-ex-tools">
            <div className="run-ex-ctl" role="group" aria-label="Zoom">
              <button
                className="run-ex-ctl-btn"
                onClick={() => zoomBy(-0.1)}
                disabled={zoom <= 0.7}
                aria-label="Zoom out"
              >
                <Icon name="minus" size={15} />
              </button>
              <span className="run-ex-ctl-val">{Math.round(zoom * 100)}%</span>
              <button
                className="run-ex-ctl-btn"
                onClick={() => zoomBy(0.1)}
                disabled={zoom >= 1.5}
                aria-label="Zoom in"
              >
                <Icon name="add" size={15} />
              </button>
            </div>
            <span className="run-ex-tools-div" aria-hidden="true" />
            <div className="run-ex-ctl" role="group" aria-label="Pages">
              <button
                className="run-ex-ctl-btn"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="run-ex-ctl-val">
                Page {page}
                <span className="run-ex-ctl-of"> of {doc.length}</span>
              </span>
              <button
                className="run-ex-ctl-btn"
                onClick={() => goPage(page + 1)}
                disabled={page >= doc.length}
                aria-label="Next page"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="run-ex-scroll scroll" ref={scrollRef} onScroll={onScroll}>
          <div className="run-ex-pages" style={{ "--page-w": `${Math.round(PAGE_W * zoom)}px` } as React.CSSProperties}>
            {doc.map((p) => (
              <article
                key={p.n}
                className={`run-ex-page${p.cover ? " run-ex-page--cover" : ""}`}
                ref={(el) => {
                  pageRefs.current[p.n] = el;
                }}
              >
                {!p.cover && (
                  <div className="run-ex-page-head">
                    <span className="run-ex-page-head-firm">{review.appraisalFirm}</span>
                    <span className="run-ex-page-head-sec">{p.title}</span>
                  </div>
                )}

                <div className="run-ex-page-body">
                  {p.cover && (
                    <div className="run-ex-letterhead">
                      <div className="run-ex-lh-mark" aria-hidden="true">
                        {firmInitials}
                      </div>
                      <div className="run-ex-lh-id">
                        <div className="run-ex-lh-name">{review.appraisalFirm}</div>
                        <div className="run-ex-lh-tag">
                          Commercial Real Estate Appraisal &amp; Advisory
                        </div>
                      </div>
                      <div className="run-ex-lh-contact">
                        <span>1200 Commerce Street, Suite 400</span>
                        <span>
                          (555) 018-4420 · reports@{firmSlug}.com
                        </span>
                        <span>State-Certified General Appraiser</span>
                      </div>
                    </div>
                  )}
                  {p.blocks.map(renderBlock)}
                </div>

                {/* Scanned/OCR fallback only: right-margin tags aligned to the
                    cited line. Vector PDFs use the inline highlight badge above. */}
                {SCANNED &&
                  (anchorsByPage[p.n] ?? []).map((fid) => {
                    const top = tagTops[fid];
                    if (top == null) return null;
                    const f = findingById[fid];
                    const tone = SEV_META[f.severity].tone;
                    return (
                      <button
                        key={fid}
                        className={`run-anno-tag run-anno-tag--${tone}${selectedId === fid ? " active" : ""}`}
                        style={{ top }}
                        onClick={() => selectFinding(fid)}
                        aria-label={`Finding ${numberOf[fid]}: ${f.category}`}
                      >
                        {numberOf[fid]}
                      </button>
                    );
                  })}

                <div className="run-ex-page-foot">
                  <span>Confidential · prepared for {review.bank}</span>
                  <span className="run-ex-page-foot-n">
                    Page {p.n} of {doc.length}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Synced exceptions thread ---- */}
      <aside className="run-ex-thread">
        <div className="run-ex-thread-head">
          <span className="run-ex-thread-title">
            Findings
            <span className="run-ex-count">{exceptions.length}</span>
          </span>
          <ActionMenu
            tooltip="More actions"
            items={[{ label: "Accept all pending", icon: "check-all", onClick: agreeAll }]}
          />
        </div>

        <div className="run-ex-list scroll">
          {exceptions.map((f, i) => {
            const active = f.id === selectedId;
            const state: FindingState = states[f.id] ?? { disposition: "pending" };
            const disp = state.disposition;
            const sev = SEV_META[f.severity];
            const removed = disp === "removed";
            return (
              <div
                key={f.id}
                className={`run-ex-item${active ? " active" : ""}${removed ? " is-removed" : ""}`}
                style={{ borderLeftColor: sev.color }}
              >
                <button
                  className="run-ex-item-head"
                  onClick={() => selectFinding(f.id)}
                  aria-expanded={active}
                >
                  <span className={`run-ex-num run-ex-num--${sev.tone}`}>{i + 1}</span>
                  <span className="run-ex-item-title">{f.category}</span>
                  <span className="run-ex-headconf">{Math.round(f.confidence * 100)}%</span>
                  <span
                    className={`run-ex-state run-ex-state--${disp}`}
                    aria-hidden="true"
                    title={disp === "pending" ? "No decision yet" : disp}
                  />
                  <Icon
                    name="chevron-down"
                    size={16}
                    className={`run-ex-chev${active ? " open" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      key="body"
                      className="run-ex-item-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                    {/* FINDING */}
                    <div className="run-ex-zone">
                      <div className="run-ex-zt">
                        Finding
                        <span className={`run-ex-sev run-ex-sev--${sev.tone}`}>{sev.label}</span>
                      </div>
                      <p className="run-ex-q">{f.question}</p>
                      <p className="run-ex-analysis">{f.analysis}</p>
                    </div>

                    <div className="run-ex-hair" />

                    {/* EVIDENCE */}
                    <div className="run-ex-zone">
                      <div className="run-ex-zt">
                        Evidence
                        <button
                          className="run-ex-zcite"
                          onClick={() => selectFinding(f.id)}
                          aria-label={`Jump to the cited span on page ${f.page}`}
                        >
                          p.{f.page}
                          <Icon name="forward" size={12} />
                        </button>
                      </div>
                      <blockquote className="run-ex-evidence">
                        <Icon name="quote" size={13} /> {f.evidence}
                      </blockquote>
                    </div>

                    <div className="run-ex-hair" />

                    {/* AI AUDIT TRAIL — multi-stage reasoning chain */}
                    <div className="run-ex-zone">
                      <div className="run-ex-zt run-ex-zt--ai">
                        <Icon name="ai" size={13} />
                        AI audit trail
                      </div>
                      <ol className="run-ex-audit">
                        {auditStages(f).map((s) => (
                          <li key={s.n} className="run-ex-astage">
                            <span className="run-ex-astage-rail" aria-hidden="true">
                              <span className={`run-ex-astage-dot run-ex-astage-dot--${s.tone}`} />
                            </span>
                            <div className="run-ex-astage-main">
                              <span className="run-ex-astage-h">
                                <span className="run-ex-astage-step">S{s.n}</span>
                                <span className="run-ex-astage-label">{s.label}</span>
                                <span className={`run-ex-averdict run-ex-averdict--${s.tone}`}>
                                  {s.verdict}
                                </span>
                              </span>
                              <p className="run-ex-astage-t">{s.text}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      {/* Citation / proof-point seam (F3) — awaiting Ed's raw 5-stage output. */}
                    </div>

                    <div className="run-ex-hair" />

                    {/* YOUR DECISION */}
                    <div className="run-ex-zone">
                      <div className="run-ex-zt">Your decision</div>
                      <YourDecision state={state} responses={responses} />
                    </div>

                    <FindingDecisionBar
                      finding={f}
                      state={state}
                      property={review.propertyAddress}
                      responseTemplates={responses}
                      variant="accordion"
                      keyboard={active}
                      onDisposition={(d, reason, templateId) =>
                        setDisposition(f.id, d, reason, templateId)
                      }
                      onComment={(comment) => setComment(f.id, comment)}
                      onToggleCondition={() => toggleCondition(f.id)}
                      onToggleFlag={() => toggleFlag(f.id)}
                    />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="run-ex-foot">
          <Button
            variant="primary"
            size="sm"
            iconLeft={workbookDirty ? "refresh" : "back"}
            block
            onClick={() => {
              if (workbookDirty) regenerate();
              onBack();
            }}
          >
            {workbookDirty ? "Regenerate workbook" : "Back to workbook"}
          </Button>
          <p className="run-ex-foot-note">
            {workbookDirty
              ? "Findings changed — regenerate to fold them into the workbook."
              : "The workbook reflects your decisions as compiled."}
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------ Your decision ----------------------------- */

const DECISION_META: Record<
  Exclude<FindingState["disposition"], "pending">,
  { label: string; tone: string }
> = {
  accepted: { label: "Accepted — kept as written", tone: "pass" },
  override: { label: "Edited", tone: "flag" },
  rejected: { label: "Rejected — returns to appraiser", tone: "fail" },
  commented: { label: "Comment recorded", tone: "info" },
  removed: { label: "Removed from workbook — kept for audit", tone: "muted" },
};

/** The reviewer's recorded decision (reason / edited wording / comment + the
 *  response template used), shown above the decision bar. Empty prompt until a
 *  decision is made. */
function YourDecision({
  state,
  responses,
}: {
  state: FindingState;
  responses: ResponseTemplate[];
}) {
  if (state.disposition === "pending") {
    return <p className="run-ex-decision-empty">No decision yet — choose below.</p>;
  }
  const meta = DECISION_META[state.disposition];
  const detail =
    state.disposition === "commented"
      ? state.comment || state.reason
      : state.reason;
  const template = state.templateId
    ? responses.find((r) => r.id === state.templateId)?.name
    : undefined;
  return (
    <div className="run-ex-decision">
      <span className={`run-ex-decision-tag run-ex-decision-tag--${meta.tone}`}>
        {meta.label}
      </span>
      {detail && <p className="run-ex-decision-text">“{detail}”</p>}
      {template && (
        <span className="run-ex-decision-tpl">
          <Icon name="templates" size={12} /> {template}
        </span>
      )}
    </div>
  );
}
