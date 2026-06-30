"use client";

import { useMemo, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { SOURCE_PAGES } from "@/data/source-pages";
import type { Finding, Severity } from "@/types";

/** Pin slots (normalized % within the page sheet) so co-page pins don't stack. */
const PIN_SPOTS: { x: number; y: number }[] = [
  { x: 12, y: 20 },
  { x: 60, y: 38 },
  { x: 22, y: 62 },
  { x: 68, y: 76 },
];

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

/**
 * S-B Exceptions — the Ashore-style proofing view. The appraisal page is the
 * canvas; findings sit on it as numbered pins keyed to the page they cite, with a
 * synced thread on the right. Selecting a pin ⇄ its thread item; Agree / Override
 * / Flag write back live (the workbook updates immediately).
 */
export function RunExceptions({
  reviewId,
  onBack,
}: {
  reviewId: string;
  onBack: () => void;
}) {
  const { findings, states, setDisposition, toggleFlag } = useWorkspaceStore();

  const exceptions = useMemo(
    () => [...findings].sort((a, b) => rank(a) - rank(b)),
    [findings],
  );

  // The set of appraisal pages reachable via the page nav: every excerpt page
  // plus every page a finding cites, sorted.
  const pageList = useMemo(() => {
    const set = new Set<number>([
      ...Object.keys(SOURCE_PAGES).map(Number),
      ...findings.map((f) => f.page),
    ]);
    return [...set].sort((a, b) => a - b);
  }, [findings]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewPage, setViewPage] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const selected =
    exceptions.find((f) => f.id === selectedId) ?? exceptions[0] ?? null;
  // The page on the canvas: an explicit nav choice, else the selected finding's.
  const currentPage = viewPage ?? selected?.page ?? pageList[0] ?? 0;
  const pageIdx = pageList.indexOf(currentPage);

  // Selecting a finding (pin or thread) syncs the canvas to its cited page.
  const selectFinding = (f: Finding) => {
    setSelectedId(f.id);
    setViewPage(f.page);
  };

  const goPage = (delta: number) => {
    const next = pageList[pageIdx + delta];
    if (next !== undefined) setViewPage(next);
  };
  const zoomBy = (delta: number) =>
    setZoom((z) => Math.min(1.5, Math.max(0.7, +(z + delta).toFixed(2))));

  // Pins for the page currently shown (numbered by their thread position).
  const pinsOnPage = exceptions
    .map((f, i) => ({ f, n: i + 1 }))
    .filter((p) => p.f.page === currentPage);

  const src = SOURCE_PAGES[currentPage];

  const renderBody = () => {
    if (!src) return null;
    if (!src.highlight) return src.body;
    const idx = src.body.indexOf(src.highlight);
    if (idx === -1) return src.body;
    return (
      <>
        {src.body.slice(0, idx)}
        <mark className="run-ex-hl">{src.highlight}</mark>
        {src.body.slice(idx + src.highlight.length)}
      </>
    );
  };

  if (!selected) {
    return (
      <div className="run-loading text-secondary">No findings to review.</div>
    );
  }

  return (
    <div className="run-ex" key={reviewId}>
      {/* ---- Document canvas with spatial pins ---- */}
      <div className="run-ex-doc">
        <div className="run-ex-doc-bar">
          <span className="run-ex-doc-meta">
            <Icon name="pdf" size={15} /> Source appraisal
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
            <div className="run-ex-ctl" role="group" aria-label="Page navigation">
              <button
                className="run-ex-ctl-btn"
                onClick={() => goPage(-1)}
                disabled={pageIdx <= 0}
                aria-label="Previous page"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="run-ex-ctl-val">
                Page {currentPage}
                <span className="run-ex-ctl-of"> / {pageList.length}</span>
              </span>
              <button
                className="run-ex-ctl-btn"
                onClick={() => goPage(1)}
                disabled={pageIdx >= pageList.length - 1}
                aria-label="Next page"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="run-ex-canvas scroll">
          <div className="run-ex-sheet" style={{ zoom }}>
            {src ? (
              <>
                <h4>{src.heading}</h4>
                <div className="run-ex-sheet-body">{renderBody()}</div>
              </>
            ) : (
              <div className="run-ex-sheet-empty">
                <Icon name="pdf" size={26} />
                <p>Page {currentPage} isn&rsquo;t part of the excerpt set in this prototype.</p>
              </div>
            )}

            {pinsOnPage.map((p, i) => {
              const spot = PIN_SPOTS[i % PIN_SPOTS.length];
              const active = p.f.id === selected.id;
              const tone = SEV_META[p.f.severity].tone;
              return (
                <button
                  key={p.f.id}
                  className={`run-pin run-pin--${tone}${active ? " active" : ""}`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  onClick={() => selectFinding(p.f)}
                  aria-label={`Exception ${p.n}: ${p.f.category}`}
                >
                  {p.n}
                </button>
              );
            })}
          </div>
          <div className="run-ex-pagenum">Page {currentPage} · Subject Appraisal</div>
        </div>
      </div>

      {/* ---- Synced exceptions thread ---- */}
      <aside className="run-ex-thread">
        <div className="run-ex-thread-head">
          <span className="run-ex-thread-title">
            Exceptions
            <span className="run-ex-count">{exceptions.length}</span>
          </span>
        </div>

        <div className="run-ex-list scroll">
          {exceptions.map((f, i) => {
            const active = f.id === selected.id;
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
                  onClick={() => selectFinding(f)}
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
                      <span className="run-ex-cite">p.{f.page}</span>
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
