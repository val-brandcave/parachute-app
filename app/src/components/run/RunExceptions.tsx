"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { buildAppraisalDoc, type DocBlock, type DocRun } from "@/data/appraisal-doc";
import { valueSummary, formatLongDate } from "@/lib/workbook";
import type { Finding, Review, Severity } from "@/types";

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

/**
 * S-B Exceptions — the proofing view. The ORIGINAL appraisal is the hero: a
 * continuous scroll of white Letter pages (a real third-party PDF, so the paper
 * is always white regardless of app theme). The AI's findings are pinned directly
 * onto the document — the cited span is highlighted inline (severity-coloured) and
 * a numbered tag sits in the right margin beside it, synced to the thread on the
 * right. Selecting a finding (tag, highlight, or thread row) scrolls to and
 * focuses its highlight; Agree / Override / Flag write back to the workbook live.
 */
export function RunExceptions({ review, onBack }: { review: Review; onBack: () => void }) {
  const { findings, states, setDisposition, toggleFlag } = useWorkspaceStore();

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
    <div className="run-ex">
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

                {/* Right-margin annotation tags, aligned to their cited line */}
                {(anchorsByPage[p.n] ?? []).map((fid) => {
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
        </div>

        <div className="run-ex-list scroll">
          {exceptions.map((f, i) => {
            const active = f.id === selectedId;
            const disp = states[f.id]?.disposition ?? "pending";
            const flagged = !!states[f.id]?.flagged;
            const sev = SEV_META[f.severity];
            return (
              <div
                key={f.id}
                className={`run-ex-item${active ? " active" : ""}`}
                style={{ borderLeftColor: sev.color }}
              >
                <button
                  className="run-ex-item-head"
                  onClick={() => selectFinding(f.id)}
                  aria-expanded={active}
                >
                  <span className={`run-ex-num run-ex-num--${sev.tone}`}>{i + 1}</span>
                  <span className="run-ex-item-title">{f.category}</span>
                  <span className={`run-ex-state run-ex-state--${disp}`} aria-hidden="true" />
                </button>

                {active && (
                  <div className="run-ex-item-body">
                    <div className="run-ex-item-tags">
                      <span className={`run-ex-sev run-ex-sev--${sev.tone}`}>{sev.label}</span>
                      <span className="run-ex-conf">
                        <span className="run-ex-conf-bar">
                          <span style={{ width: `${Math.round(f.confidence * 100)}%` }} />
                        </span>
                        {Math.round(f.confidence * 100)}%
                      </span>
                      <span className="run-ex-cite">report p.{f.page}</span>
                    </div>

                    <p className="run-ex-q">{f.question}</p>
                    <p className="run-ex-analysis">{f.analysis}</p>
                    <blockquote className="run-ex-evidence">
                      <Icon name="quote" size={13} /> {f.evidence}
                    </blockquote>

                    <div className="run-ex-actions">
                      <button
                        className={`run-ex-act${disp === "accepted" ? " on on--pass" : ""}`}
                        onClick={() => setDisposition(f.id, "accepted")}
                      >
                        <Icon name="check" size={14} /> Agree
                      </button>
                      <button
                        className={`run-ex-act${disp === "override" || disp === "rejected" ? " on on--fail" : ""}`}
                        onClick={() => setDisposition(f.id, "override")}
                      >
                        <Icon name="edit" size={14} /> Override
                      </button>
                      <button
                        className={`run-ex-act${flagged ? " on on--flag" : ""}`}
                        onClick={() => toggleFlag(f.id)}
                      >
                        <Icon name="flag" size={14} /> Flag
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="run-ex-foot">
          <Button variant="primary" size="sm" iconLeft="back" block onClick={onBack}>
            Back to workbook
          </Button>
          <p className="run-ex-foot-note">Decisions write to the workbook live.</p>
        </div>
      </aside>
    </div>
  );
}
