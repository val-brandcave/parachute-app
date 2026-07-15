"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/atoms";
import { buildAppraisalDoc, type DocBlock, type DocRun } from "@/data/appraisal-doc";
import { valueSummary, formatLongDate } from "@/lib/workbook";
import type { Review } from "@/types";

/** What to reveal in the source.
 *  - `finding` / `item`: scroll to + highlight the cited SPAN (anchor / attAnchor).
 *  - `page`: a bare "p.N" prose citation with no span anchor — scroll to that
 *    RENDERED page and flash it (no span highlight). `id` carries the page number. */
export type SourceFocus =
  | { kind: "finding" | "item"; id: string }
  | { kind: "page"; id: number };

/** Base page width (px) at 100%; zoom scales it (text stays crisp, reflows). */
const PAGE_W = 760;

/**
 * SourceDoc — the single, read-only view of the ORIGINAL appraisal (Jul 14: the
 * source is the immutable truth; you verify against it, you never mark it up).
 *
 * It renders the exact `buildAppraisalDoc` document the app has always shown —
 * a continuous scroll of white Letter pages (a real third-party PDF, so paper is
 * white in both themes) — with NO annotation layer, NO decision rail, and no way
 * to edit it. The only interactive element is the citation focus: when `focus`
 * is set, the cited run is highlighted and scrolled into view with a one-time
 * attention pulse. The same component serves the "Source" nav (full, no focus)
 * and the side-by-side citation pane (with a live focus + a close affordance).
 */
export function SourceDoc({
  review,
  focus = null,
  onClose,
  variant = "full",
}: {
  review: Review;
  /** The cited span to reveal + pulse. Live in pane mode (changes as the reviewer
   *  clicks different citations); null in the full "Source" nav view. */
  focus?: SourceFocus | null;
  /** Pane mode only — dismiss the side-by-side pane. */
  onClose?: () => void;
  variant?: "full" | "pane";
}) {
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

  // Rendered page (1..N) the focused cited span sits on — drives the pane's page
  // label. Keyed by whichever anchor field matches the focus kind.
  const focusPage = useMemo(() => {
    if (!focus) return null;
    if (focus.kind === "page") return focus.id;
    for (const p of doc) {
      for (const b of p.blocks) {
        const runs = b.type === "p" || b.type === "note" ? b.runs : [];
        for (const r of runs) {
          const hit = focus.kind === "finding" ? r.anchor === focus.id : r.attAnchor === focus.id;
          if (hit) return p.n;
        }
      }
    }
    return null;
  }, [doc, focus]);

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

  // Pane mode defaults to 75% — a full appraisal page at 100% overflows the
  // narrower split column; 75% fits it comfortably. The full "Source" nav view
  // keeps 100%.
  const [zoom, setZoom] = useState(variant === "pane" ? 0.75 : 1);
  const [page, setPage] = useState(1);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [flashPage, setFlashPage] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLElement | null>>({});

  const goPage = (n: number) => {
    pageRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Reveal the focused citation: scroll its highlighted span to center, then fire
  // a one-time pulse so the eye lands on the exact paragraph. Live-reactive — the
  // pane stays mounted, so re-focusing on another citation re-runs this. The
  // pulse is decorative; `prefers-reduced-motion` keeps the static highlight only.
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      // Span citation (finding / item): scroll to + pulse the exact highlight.
      if (focus.kind !== "page") {
        const el = scrollRef.current?.querySelector<HTMLElement>(
          `#${CSS.escape(`src-focus-${focus.id}`)}`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setPulseId(String(focus.id));
          return;
        }
      }
      // Page citation (bare "p.N") or a span with no anchor in this stand-in doc:
      // land on the mapped page and flash it.
      if (focusPage) {
        goPage(focusPage);
        setFlashPage(focusPage);
      }
    }, 60);
    return () => clearTimeout(t);
  }, [focus, focusPage]);

  // Clear the pulse / page-flash once the animation has run, so a later re-focus
  // on the same target re-triggers it.
  useEffect(() => {
    if (!pulseId) return;
    const t = setTimeout(() => setPulseId(null), 1300);
    return () => clearTimeout(t);
  }, [pulseId]);
  useEffect(() => {
    if (flashPage == null) return;
    const t = setTimeout(() => setFlashPage(null), 1300);
    return () => clearTimeout(t);
  }, [flashPage]);

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
  const zoomBy = (d: number) => setZoom((z) => Math.min(1.5, Math.max(0.7, +(z + d).toFixed(2))));

  /* ---- document rendering (clean; only the focused span is highlighted) ---- */

  const renderRun = (r: DocRun, key: number) => {
    if (focus && focus.kind !== "page") {
      const anchorId = focus.kind === "item" ? r.attAnchor : r.anchor;
      if (anchorId === focus.id) {
        return (
          <mark
            key={key}
            id={`src-focus-${focus.id}`}
            className={`src-focus${pulseId === String(focus.id) ? " is-pulse" : ""}`}
          >
            {r.text}
          </mark>
        );
      }
    }
    return <Fragment key={key}>{r.text}</Fragment>;
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
            {b.runs.map((r, j) => renderRun(r, j))}
          </p>
        );
      case "note":
        return (
          <p className="run-doc-note" key={i}>
            {b.runs.map((r, j) => renderRun(r, j))}
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

  return (
    <div className={`run-ex src-doc src-doc--${variant}`}>
      <div className="run-ex-doc">
        <div className="run-ex-bar">
          <span className="run-ex-doc-meta">
            <Icon name="pdf" size={15} /> Source appraisal
            {variant === "pane" && focusPage ? (
              <span className="src-doc-cite">
                {" "}
                · p.{focusPage}
              </span>
            ) : (
              <span className="run-ex-doc-firm"> · {review.appraisalFirm}</span>
            )}
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
            {variant === "pane" && onClose && (
              <>
                <span className="run-ex-tools-div" aria-hidden="true" />
                <button className="src-doc-close" onClick={onClose} aria-label="Close source">
                  <Icon name="close" size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="run-ex-scroll scroll" ref={scrollRef} onScroll={onScroll}>
          <div
            className="run-ex-pages"
            style={{ "--page-w": `${Math.round(PAGE_W * zoom)}px` } as React.CSSProperties}
          >
            {doc.map((p) => (
              <article
                key={p.n}
                data-page={p.n}
                className={`run-ex-page${p.cover ? " run-ex-page--cover" : ""}${
                  flashPage === p.n ? " is-cite-flash" : ""
                }`}
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
                        <span>(555) 018-4420 · reports@{firmSlug}.com</span>
                        <span>State-Certified General Appraiser</span>
                      </div>
                    </div>
                  )}
                  {p.blocks.map((b, i) => renderBlock(b, i))}
                </div>

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
    </div>
  );
}
