"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, ParachuteGlyph } from "@/components/atoms";
import { StatusPill, SegmentedControl } from "@/components/molecules";
import {
  useAdminStore,
  useUsersStore,
  attTally,
  type AttestationRow,
  type AttestationSignature,
} from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import { formatLongDate, valueSummary, WORKBOOK_FOOTER } from "@/lib/workbook";
import {
  AttestationDocRow,
  type AttestationDocActions,
} from "@/components/review/AttestationDocInline";
import { RunActivityPanel } from "./RunActivity";
import { SourceDoc, type SourceFocus } from "./SourceDoc";
import { SourcePaneContext } from "@/components/review/CitationText";
import type { AttestationState, AttAnswer, Review } from "@/types";

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_CLASS: Record<AttAnswer, string> = { YES: "yes", NO: "no", NA: "na" };

/**
 * Attestation sub-view of the run-flow Administrative tab — the compiled,
 * signable attestation document in run chrome (the Admin twin of `RunWorkbook`).
 * The document is a real multi-page PDF that MIRRORS the Technical workbook: a
 * branded navy cover, a contents page, then the compliance checklist grouped
 * into section tables, and a reviewer-attestation certification block — all on
 * the fixed white `--paper-*` sheets.
 *
 * Phase 2c: the attestation document IS the decision surface — every checklist
 * row answers inline (Yes/No/N-A + divergence reason, `AttestationDocRow`), so
 * answers apply live and the old dirty→Regenerate loop is gone (Decision E,
 * applied to the Admin twin). The Source view keeps full parity via the shared
 * admin store. Structure stays locked — the checklist is org-authored in
 * Templates. Signing is gated until every item is attested; on sign it seals
 * the attestation (SHA-256) AND marks the Administrative type signed at the
 * run level so the two-type gate resolves.
 */
export function RunAttestationPreview({
  review,
  embedded,
  returnLabel,
  canFinish = true,
  pendingTypeLabel = null,
  onReviewChecklist,
  onSign,
  onReturn,
}: {
  review: Review;
  embedded: boolean;
  returnLabel: string | null;
  canFinish?: boolean;
  pendingTypeLabel?: string | null;
  onReviewChecklist: () => void;
  onSign: () => void;
  onReturn: () => void;
}) {
  const {
    rows,
    states,
    checklistName,
    checklistVersion,
    signature,
    setAnswer,
    setReason,
    confirm,
    unconfirm,
  } = useAdminStore();
  const activity = useAdminStore((s) => s.activity);
  const attRegeneratedAt = useAdminStore((s) => s.attRegeneratedAt);
  const { byId } = useUsersStore();

  // Compile sweep — the SYSTEM recompute beat (Decision E): direct answers on
  // the doc are live, but returning from the Source rail via its Regenerate
  // still plays the ~1.2s "folding in" moment, mirroring the Technical workbook.
  const [compiling, setCompiling] = useState(
    () => attRegeneratedAt != null && Date.now() - attRegeneratedAt < 2500,
  );
  const [prevStamp, setPrevStamp] = useState(attRegeneratedAt);
  if (attRegeneratedAt !== prevStamp) {
    setPrevStamp(attRegeneratedAt);
    if (attRegeneratedAt != null) setCompiling(true);
  }
  useEffect(() => {
    if (!compiling) return;
    const t = setTimeout(() => setCompiling(false), 1250);
    return () => clearTimeout(t);
  }, [compiling]);

  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  // Which checklist row is expanded on the doc (evidence + reason zone). One at
  // a time — the row is a form line, not an accordion of cards.
  const [openId, setOpenId] = useState<string | null>(null);
  // Clean view (F-152 pattern, applied to the Admin twin): Edit | Preview — the
  // true read-only deliverable render, scroll preserved across the toggle.
  const [cleanView, setCleanView] = useState(false);
  const savedScroll = useRef<number | null>(null);
  const setView = (v: "edit" | "clean") => {
    const next = v === "clean";
    if (next === cleanView) return;
    savedScroll.current = stageRef.current?.scrollTop ?? null;
    setCleanView(next);
  };
  // The right dock hosts one panel at a time — Activity and the citation Source
  // pane are mutually exclusive (Jul 15), so the attestation is never sandwiched.
  const [activityOpen, setActivityOpen] = useState(false);
  const [citeFocus, setCiteFocus] = useState<SourceFocus | null>(null);
  const toggleActivity = () =>
    setActivityOpen((v) => {
      if (!v) setCiteFocus(null);
      return !v;
    });
  const openSourceAt = (focus: SourceFocus) => {
    setCiteFocus(focus);
    setActivityOpen(false);
  };

  const t = attTally(states);
  const reviewerName = byId(review.assigneeId)?.signatureName || CURRENT_USER.signatureName;
  const signed = !!signature;

  // Count rendered sheets for "Page X of N"; MutationObserver keeps it current as
  // attestations flip (a group can gain/lose a "changed" reason row).
  useLayoutEffect(() => {
    const sc = stageRef.current;
    if (!sc) return;
    const count = () => {
      const n = sc.querySelectorAll(".wb-page").length;
      if (n) setPageCount(n);
    };
    count();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(count);
    mo.observe(sc, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // Restore scroll after an Edit|Preview toggle re-lays-out the document, so
  // the reviewer's place in the doc holds across the switch.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (savedScroll.current != null && el) {
      el.scrollTo({ top: savedScroll.current });
      savedScroll.current = null;
    }
  }, [cleanView]);

  const zoomBy = (d: number) =>
    setZoom((z) => Math.min(1.5, Math.max(0.7, +(z + d).toFixed(2))));
  const onStageScroll = () => {
    const sc = stageRef.current;
    if (!sc) return;
    const top = sc.getBoundingClientRect().top;
    let cur = 1;
    sc.querySelectorAll<HTMLElement>(".wb-page").forEach((el, i) => {
      if (el.getBoundingClientRect().top - top <= 120) cur = i + 1;
    });
    setPage(cur);
  };
  const goPage = (n: number) => {
    const target = Math.min(Math.max(1, n), pageCount);
    stageRef.current
      ?.querySelectorAll<HTMLElement>(".wb-page")
      [target - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <SourcePaneContext.Provider value={openSourceAt}>
    <div className="run-wb" data-review-type="administrative">
      <div className="run-wb-bar">
        <span className="run-wb-bar-label">
          Attestation
          <StatusPill
            tone="neutral"
            icon={signed ? "check-circle" : undefined}
            indicatorTone={signed ? "pass" : undefined}
          >
            {signed ? "Signed" : "Draft"}
          </StatusPill>
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
              Page {Math.min(page, pageCount)}
              <span className="run-ex-ctl-of"> of {pageCount}</span>
            </span>
            <button
              className="run-ex-ctl-btn"
              onClick={() => goPage(page + 1)}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          {/* View mode (F-153 taxonomy, Admin twin) — Edit | Preview. Hidden
              once signed (a final doc is already clean). */}
          {!signed && (
            <>
              <span className="run-ex-tools-div" aria-hidden="true" />
              <span className="run-wb-viewmode">
                <SegmentedControl
                  options={[
                    { value: "edit", label: "Edit" },
                    { value: "clean", label: "Preview" },
                  ]}
                  value={cleanView ? "clean" : "edit"}
                  onChange={(v) => setView(v as "edit" | "clean")}
                />
              </span>
            </>
          )}

          {/* Panels — the Activity ledger (audit layer 3) docks on the right,
              same shell as the Technical workbook. Admin has no Customize (the
              checklist form is org-authored in Templates, never styled here). */}
          <span className="run-ex-tools-div" aria-hidden="true" />
          <div className="run-wb-panels" role="group" aria-label="Panels">
            <button
              className={`run-wb-tbtn${activityOpen ? " is-active" : ""}`}
              onClick={toggleActivity}
              aria-expanded={activityOpen}
              aria-label="Activity ledger"
            >
              <Icon name="history" size={14} />
              Activity
              {activity.length > 1 && (
                <span className="run-wb-tbtn-count">{activity.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="run-wb-main">
        <div
          className={`run-wb-stage scroll${compiling ? " is-compiling" : ""}`}
          ref={stageRef}
          onScroll={onStageScroll}
        >
          {compiling && (
            <div className="run-compile" role="status">
              <span className="ui-spinner" aria-hidden="true" />
              Folding your attestations in…
            </div>
          )}
          {/* Accept-by-default (Jul 14): the AI's answers ARE the attestation.
              No "review each item first" gate — a calm, non-blocking helper
              instead. The reviewer changes only what they disagree with, then
              Confirm & sign attests the rest as suggested (the human touch). */}
          {!signed && !cleanView && t.pending > 0 && (
            <p className="run-att-helper" role="status">
              <Icon name="ai" size={14} />
              Everything&rsquo;s pre-filled from the compliance checklist. Change what you
              disagree with — <b>Confirm &amp; sign</b> attests the rest as suggested.
            </p>
          )}

          <div className="run-wb-zoom" style={{ zoom }}>
            <AttestationBook
              review={review}
              rows={rows}
              states={states}
              checklistName={checklistName}
              checklistVersion={checklistVersion}
              reviewerName={reviewerName}
              signature={signature}
              editing={
                signed || cleanView
                  ? null
                  : {
                      onSetAnswer: setAnswer,
                      onSetReason: setReason,
                      onConfirm: confirm,
                      onUnconfirm: unconfirm,
                      onOpenSource: (id) => openSourceAt({ kind: "item", id }),
                    }
              }
              openId={openId}
              onSetOpen={setOpenId}
            />
          </div>
        </div>

        {citeFocus && (
          <SourceDoc
            review={review}
            variant="pane"
            focus={citeFocus}
            onClose={() => setCiteFocus(null)}
          />
        )}
        {activityOpen && (
          <RunActivityPanel
            entries={activity}
            docNoun="attestation"
            reviewerName={reviewerName}
            onClose={() => setActivityOpen(false)}
          />
        )}
      </div>

      <footer className="run-foot">
        <div className="run-foot-actions">
          {signed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                iconLeft="download"
                onClick={() => window.print()}
              >
                Download
              </Button>
              {canFinish ? (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={embedded ? "forward" : "reviews"}
                  onClick={onReturn}
                >
                  {embedded ? `Return to ${returnLabel ?? "YouConnect"}` : "Go to reviews"}
                </Button>
              ) : (
                <span className="run-foot-gate">
                  <Icon name="clock" size={14} />
                  Sign {pendingTypeLabel ?? "all review types"} to finish
                </span>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" iconLeft="pdf" onClick={onReviewChecklist}>
                View source
              </Button>
              <Button variant="primary" size="sm" iconLeft="check-circle" onClick={onSign}>
                Confirm &amp; sign attestation
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
    </SourcePaneContext.Provider>
  );
}

/* ------------------------- the compiled attestation ------------------------ */

/** One packed section — a checklist group (with its items) or the certification. */
type Sec =
  | { id: string; title: string; kind: "group"; items: AttestationRow[]; weight: number }
  | { id: "cert"; title: string; kind: "cert"; weight: number };

/** Rough per-section height as a fraction of one Letter sheet, to pack sections
 *  onto pages so the doc reads as a real multi-page PDF (mirrors the Technical
 *  workbook's estimateWeight). */
const PAGE_BUDGET = 1.7;

/**
 * The paginated attestation document — cover → contents → grouped checklist
 * section tables → certification, on white `.wb-page` sheets. Deliberately built
 * to read as the sibling of the Technical workbook (same cover/TOC/page shell).
 * With `editing` set (unsigned, Edit view), every checklist row is a live
 * decision row (`AttestationDocRow`); null renders the clean deliverable.
 */
function AttestationBook({
  review,
  rows,
  states,
  checklistName,
  checklistVersion,
  reviewerName,
  signature,
  editing = null,
  openId = null,
  onSetOpen,
}: {
  review: Review;
  rows: AttestationRow[];
  states: Record<string, AttestationState>;
  checklistName: string | null;
  checklistVersion: number | null;
  reviewerName: string;
  signature: AttestationSignature | null;
  editing?: AttestationDocActions | null;
  openId?: string | null;
  onSetOpen?: (itemId: string | null) => void;
}) {
  const value = useMemo(() => valueSummary(review), [review]);
  const draft = !signature;
  // A signed document is final — editing never renders over the seal.
  const edit = signature ? null : editing;

  // Group rows in first-seen order → one section each, plus the certification.
  const sections: Sec[] = useMemo(() => {
    const groups: string[] = [];
    for (const r of rows) if (!groups.includes(r.group)) groups.push(r.group);
    const groupSecs: Sec[] = groups.map((g) => {
      const items = rows.filter((r) => r.group === g);
      return { id: g, title: g, kind: "group", items, weight: 0.18 + items.length * 0.08 };
    });
    return [...groupSecs, { id: "cert", title: "Reviewer Attestation", kind: "cert", weight: 0.5 }];
  }, [rows]);

  // Number + weight-pack into content pages (cover = 1, contents = 2, content ≥ 3).
  const labeled = sections.map((s, i) => ({ ...s, label: String(i + 1) }));
  const pages: (typeof labeled)[] = [];
  let cur: typeof labeled = [];
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

  const hasToc = pages.length > 0;
  const coverPages = hasToc ? 2 : 1;
  const totalPages = coverPages + pages.length;
  const toc = pages.flatMap((pg, pi) =>
    pg.map((it) => ({ id: it.id, label: it.label, title: it.title, pageNo: pi + coverPages + 1 })),
  );

  const runHead = (
    <div className="wb-runhead">
      <span className="wb-runhead-org">
        <Icon name="org" size={14} />
        {review.bank}
      </span>
      <span className="wb-runhead-doc">Administrative Review Attestation</span>
    </div>
  );

  const renderSection = (s: (typeof labeled)[number]) => {
    if (s.kind === "cert") {
      return (
        <section className="wb-sec" key={s.id}>
          <h3 className="wb-sec-h" style={{ fontFamily: "var(--wb-head)" }}>
            <span className="wb-sec-n">{s.label}</span>
            {s.title}
          </h3>
          <p className="wb-prose wb-cert-stmt">
            I attest that I have reviewed each item above against the appraisal report, and that the
            answers — including any changes from the AI&rsquo;s suggested answers, each with a
            documented reason — reflect my independent professional judgment.
          </p>
          {signature ? (
            <div className="wb-sig">
              <div className="wb-sig-mark" style={{ fontFamily: "var(--wb-head)" }}>
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
        </section>
      );
    }
    return (
      <section className="wb-sec" key={s.id}>
        <h3 className="wb-sec-h" style={{ fontFamily: "var(--wb-head)" }}>
          <span className="wb-sec-n">{s.label}</span>
          {s.title}
        </h3>
        <table className="attdoc-table">
          <thead>
            <tr>
              <th className="attdoc-n">#</th>
              <th>Checklist item</th>
              <th className="attdoc-ans-col">Answer</th>
              <th className="attdoc-cite">Cite</th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((r, i) => {
              const st = states[r.itemId] ?? { answer: r.aiAnswer, confirmed: false };
              // Edit view: the row IS the decision surface (Phase 2c).
              if (edit && onSetOpen)
                return (
                  <AttestationDocRow
                    key={r.itemId}
                    r={r}
                    state={st}
                    index={i}
                    open={openId === r.itemId}
                    actions={edit}
                    onSetOpen={onSetOpen}
                  />
                );
              const wasChanged = st.confirmed && st.answer !== r.aiAnswer;
              return (
                <tr key={r.itemId}>
                  <td className="attdoc-n">{i + 1}</td>
                  <td>
                    {r.question}
                    {wasChanged && (
                      <div className="attdoc-changed">
                        <b>Changed from {ANS_LABEL[r.aiAnswer]}</b> — {st.reason}
                      </div>
                    )}
                  </td>
                  <td className="attdoc-ans-col">
                    {st.confirmed ? (
                      <b className={`attdoc-ans attdoc-ans--${ANS_CLASS[st.answer]}`}>
                        {ANS_LABEL[st.answer]}
                      </b>
                    ) : (
                      <span className="attdoc-ph">NOT ATTESTED</span>
                    )}
                  </td>
                  <td className="attdoc-cite">{r.page > 0 ? `p.${r.page}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  };

  return (
    <article
      className={`wb-doc${draft ? " is-draft" : ""}`}
      style={
        { "--wb-accent": "var(--md-primary)", "--wb-head": "var(--font-display)" } as React.CSSProperties
      }
    >
      {/* PAGE 1 — branded navy cover */}
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
          <div className="wb-cover-eyebrow">Administrative Review Attestation</div>
          <h1 className="wb-cover-title" style={{ fontFamily: "var(--wb-head)" }}>
            {review.propertyAddress}
          </h1>
          <div className="wb-cover-sub">
            {review.propertyType} · {checklistName ?? "Compliance Checklist"}
            {checklistVersion ? ` v${checklistVersion}` : ""} · Prepared for {review.bank}
          </div>

          {/* Process status (N of M attested) deliberately does NOT print on the
              document (F-125) — that's viewer/app state; the Sign gate carries it. */}
        </div>

        <div className="wb-cover-bottom">
          <div className="wb-band-meta">
            <Meta label="Loan #" value={review.loanNo} />
            <Meta label="Effective Date" value={formatLongDate(value.effectiveDate)} />
            <Meta label="Reviewer" value={reviewerName} />
            <Meta label="Reviewed" value={formatLongDate(review.orderedAt)} />
          </div>
          <div className="wb-page-foot wb-page-foot--cover">
            <span>{WORKBOOK_FOOTER}</span>
            <span className="wb-page-foot-n">Page 1 of {totalPages}</span>
          </div>
        </div>
      </section>

      {/* PAGE 2 — contents */}
      {hasToc && (
        <section className="wb-page wb-page--toc">
          {runHead}
          <div className="wb-toc-page">
            <div className="wb-toc-page-h" style={{ fontFamily: "var(--wb-head)" }}>
              Contents
            </div>
            <div className="wb-toc-group">Checklist sections</div>
            <ol className="wb-toc">
              {toc.map((it) => (
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
          </div>
          <div className="wb-page-foot">
            <span>{WORKBOOK_FOOTER}</span>
            <span className="wb-page-foot-n">Page 2 of {totalPages}</span>
          </div>
        </section>
      )}

      {/* Content pages — checklist sections packed onto sheets */}
      {pages.map((pg, pi) => (
        <section className="wb-page" key={`pg-${pi}`}>
          {runHead}
          <div className="wb-page-body">{pg.map(renderSection)}</div>
          <div className="wb-page-foot">
            <span>{WORKBOOK_FOOTER}</span>
            <span className="wb-page-foot-n">
              Page {pi + coverPages + 1} of {totalPages}
            </span>
          </div>
        </section>
      ))}
    </article>
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
