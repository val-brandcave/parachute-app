"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, Chip, type ChipTone } from "@/components/atoms";
import { ActionMenu, ConfidenceMeter, AttestationDecisionBar } from "@/components/molecules";
import { useAdminStore, attNeedsAttention, type AttestationRow } from "@/store";
import { buildAppraisalDoc, docPageIndex, type DocBlock, type DocRun } from "@/data/appraisal-doc";
import { valueSummary, formatLongDate } from "@/lib/workbook";
import type { AttAnswer, AttestationState, Review } from "@/types";
import type { RunReviewType } from "@/store";

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_TONE: Record<AttAnswer, ChipTone> = { YES: "pass", NO: "fail", NA: "neutral" };

/** Base page width (px) at 100%; zoom scales it. */
const PAGE_W = 760;

/** Annotation tone for an attestation span: attested → pass, still-needs-a-look
 *  → flag, otherwise a calm neutral. Mirrors the Technical severity tones so the
 *  highlight language reads the same across both tracks. */
function attTone(row: AttestationRow, state: AttestationState): "pass" | "flag" | "na" {
  if (state.confirmed) return "pass";
  if (attNeedsAttention(row)) return "flag";
  return "na";
}

/**
 * S-B Attestations (Administrative) — the compliance twin of `RunExceptions`.
 * The ORIGINAL appraisal is the hero (continuous white pages); each checklist
 * item's cited span is highlighted inline with a numbered badge, synced to a
 * right-rail accordion of checklist items. Each item carries the shared
 * `AttestationDecisionBar` (Yes/No/N-A + one-click attest, reason when diverging).
 * Wired to `admin.store` (the single source of truth for attestation state).
 */
export function RunAttestations({
  review,
  reviewType = "administrative",
  onBack,
}: {
  review: Review;
  reviewType?: RunReviewType;
  onBack: () => void;
}) {
  const { rows, states, setAnswer, setReason, confirm, unconfirm, confirmRoutine } =
    useAdminStore();
  const attDirty = useAdminStore((s) => s.attDirty);
  const regenerateAtt = useAdminStore((s) => s.regenerateAtt);

  // Order: needs-attention first, then by ascending confidence (the proofing
  // order — the riskiest attestations surface at the top).
  const ordered = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const na = attNeedsAttention(a) ? 0 : 1;
        const nb = attNeedsAttention(b) ? 0 : 1;
        return na - nb || a.confidence - b.confidence;
      }),
    [rows],
  );
  const numberOf = useMemo(() => {
    const m: Record<string, number> = {};
    ordered.forEach((r, i) => (m[r.itemId] = i + 1));
    return m;
  }, [ordered]);
  const rowByItem = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.itemId, r])) as Record<string, AttestationRow>,
    [rows],
  );

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

  // Rendered page (1..N) each item's cited span sits on in THIS doc — drives the
  // citation chip + navigation so they're truthful to the pages on screen (the
  // seed `page` is the original report's pagination, used elsewhere).
  const annoPage = useMemo(() => docPageIndex(doc), [doc]);

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

  const [picked, setPicked] = useState<string | null>(null);
  const selectedId = picked ?? ordered[0]?.itemId ?? null;
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLElement | null>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /** Two-way sync (fixed Jul 2). From the RAIL: scroll the doc to the item's
   *  highlighted span — or, since only some items have on-page spans, fall back
   *  to its evidence page so EVERY item navigates somewhere meaningful. From
   *  the DOC: also scroll the rail to the (now expanding) accordion item —
   *  after the previous item's collapse settles, so the target doesn't drift. */
  const selectItem = (id: string, from: "rail" | "doc" = "rail") => {
    setPicked(id);
    if (from === "doc") {
      setTimeout(() => {
        itemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 280);
      return;
    }
    const el = scrollRef.current?.querySelector<HTMLElement>(`#att-anno-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      const p = annoPage[id] ?? 0;
      if (p > 0) goPage(p);
    }
  };

  // On landing, point the document at the first item so the open accordion, its
  // active highlight, and the visible page all agree (instant jump — the view
  // arrives via a cross-fade, so an animated scroll would fight it).
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    const first = ordered[0]?.itemId;
    if (!first) return;
    const raf = requestAnimationFrame(() => {
      const sc = scrollRef.current;
      if (!sc) return;
      didInitialScroll.current = true;
      const el = sc.querySelector<HTMLElement>(`#att-anno-${first}`);
      if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
      else {
        const p = annoPage[first] ?? 0;
        if (p > 0) pageRefs.current[p]?.scrollIntoView({ behavior: "auto", block: "start" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [ordered, annoPage]);

  const attested = rows.filter((r) => states[r.itemId]?.confirmed).length;

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
    if (!r.attAnchor || !rowByItem[r.attAnchor]) return <Fragment key={key}>{r.text}</Fragment>;
    const row = rowByItem[r.attAnchor];
    const tone = attTone(row, states[row.itemId] ?? { answer: row.aiAnswer, confirmed: false });
    const active = selectedId === r.attAnchor;
    return (
      <mark
        key={key}
        id={`att-anno-${r.attAnchor}`}
        className={`run-anno run-anno--${tone}${active ? " active" : ""}`}
        onClick={() => selectItem(r.attAnchor!, "doc")}
      >
        <span className={`run-anno-badge run-anno-badge--${tone}`} aria-hidden="true">
          {numberOf[r.attAnchor]}
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

  if (!ordered.length) {
    return <div className="run-loading text-secondary">No checklist items to attest.</div>;
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
          <div
            className="run-ex-pages"
            style={{ "--page-w": `${Math.round(PAGE_W * zoom)}px` } as React.CSSProperties}
          >
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
                        <span>(555) 018-4420 · reports@{firmSlug}.com</span>
                        <span>State-Certified General Appraiser</span>
                      </div>
                    </div>
                  )}
                  {p.blocks.map(renderBlock)}
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

      {/* ---- Synced attestation thread ---- */}
      <aside className="run-ex-thread">
        <div className="run-ex-thread-head">
          <span className="run-ex-thread-title">
            Checklist
            <span className="run-ex-count">
              {attested}/{rows.length}
            </span>
          </span>
          <ActionMenu
            tooltip="More actions"
            items={[{ label: "Attest routine items", icon: "check-all", onClick: confirmRoutine }]}
          />
        </div>

        <div className="run-ex-list scroll">
          {ordered.map((r, i) => {
            const active = r.itemId === selectedId;
            const state: AttestationState = states[r.itemId] ?? {
              answer: r.aiAnswer,
              confirmed: false,
            };
            const tone = attTone(r, state);
            const needs = attNeedsAttention(r) && !state.confirmed;
            const dotState = state.confirmed ? "attested" : needs ? "needs" : "pending";
            return (
              <div
                key={r.itemId}
                ref={(el) => {
                  itemRefs.current[r.itemId] = el;
                }}
                className={`run-ex-item${active ? " active" : ""}`}
                style={{ borderLeftColor: `var(--md-${tone === "na" ? "outline" : tone === "pass" ? "success" : "warn"})` }}
              >
                <button
                  className="run-ex-item-head"
                  onClick={() => selectItem(r.itemId)}
                  aria-expanded={active}
                >
                  <span className={`run-ex-num run-ex-num--${tone === "na" ? "na" : tone}`}>
                    {i + 1}
                  </span>
                  <span className="run-ex-item-title">{r.group}</span>
                  {!r.unprefilled && (
                    <span className="run-ex-headconf">{Math.round(r.confidence * 100)}%</span>
                  )}
                  <span
                    className={`run-ex-state run-ex-state--att-${dotState}`}
                    aria-hidden="true"
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
                      {/* ITEM — no redundant "Checklist item" label (this IS the checklist) */}
                      <div className="run-ex-zone">
                        {needs && (
                          <span className="run-ex-attneeds">
                            <Icon name="flag" size={11} /> Needs attention
                          </span>
                        )}
                        <p className="run-ex-q">{r.question}</p>
                        <div className="run-ex-att-ai">
                          <Icon name="ai" size={13} /> AI suggests
                          <Chip tone={ANS_TONE[r.aiAnswer]}>{ANS_LABEL[r.aiAnswer]}</Chip>
                          {!r.unprefilled && <ConfidenceMeter value={r.confidence} />}
                        </div>
                      </div>

                      <div className="run-ex-hair" />

                      {/* EVIDENCE */}
                      <div className="run-ex-zone">
                        <div className="run-ex-zt">
                          Evidence
                          {annoPage[r.itemId] > 0 && (
                            <button
                              className="run-ex-zcite"
                              onClick={() => selectItem(r.itemId)}
                              aria-label={`Jump to the cited span on page ${annoPage[r.itemId]}`}
                            >
                              p.{annoPage[r.itemId]}
                              <Icon name="forward" size={12} />
                            </button>
                          )}
                        </div>
                        <blockquote className="run-ex-evidence">
                          <Icon name="quote" size={13} /> {r.evidence}
                        </blockquote>
                      </div>

                      <div className="run-ex-hair" />

                      <AttestationDecisionBar
                        row={r}
                        state={state}
                        variant="accordion"
                        keyboard={active}
                        onSetAnswer={(a) => setAnswer(r.itemId, a)}
                        onSetReason={(reason) => setReason(r.itemId, reason)}
                        onConfirm={() => confirm(r.itemId)}
                        onUnconfirm={() => unconfirm(r.itemId)}
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
            iconLeft={attDirty ? "refresh" : "back"}
            block
            onClick={() => {
              if (attDirty) regenerateAtt();
              onBack();
            }}
          >
            {attDirty ? "Regenerate attestation" : "Back to attestation"}
          </Button>
          <p className="run-ex-foot-note">
            {attDirty
              ? "Attestations changed — regenerate to fold them into the document."
              : attested === rows.length
                ? "All items attested — sign on the Attestation."
                : `${rows.length - attested} item${rows.length - attested === 1 ? "" : "s"} still need attesting.`}
          </p>
        </div>
      </aside>
    </div>
  );
}
