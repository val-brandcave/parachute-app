"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, SEV_META } from "@/lib/utils";
import { useWorkspaceStore } from "@/store";
import { FindingCard } from "@/components/review/FindingCard";
import { WorkbookRail } from "@/components/review/WorkbookRail";
import { PdfPane } from "@/components/review/PdfPane";
import type { Severity } from "@/types";

type Sort = "severity" | "page";

/**
 * Technical Review workspace (first-pass design — slated for focus-mode rebuild,
 * see docs/plans/parachute-v2-early-specs.md). Rendered as the Technical tab of
 * the review detail page, not a route.
 */
export function TechnicalWorkspace({
  reviewId,
  onOpenWorkbook,
}: {
  reviewId: string;
  onOpenWorkbook?: () => void;
}) {
  const { findings, states, isLoading, loadReview, acceptAllPasses, addReviewerFinding } =
    useWorkspaceStore();

  const [sort, setSort] = useState<Sort>("severity");
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newFinding, setNewFinding] = useState({
    category: "Reviewer Note",
    question: "",
    analysis: "",
    page: 1,
  });

  useEffect(() => {
    if (reviewId) loadReview(reviewId);
  }, [reviewId, loadReview]);

  const sorted = useMemo(() => {
    let list = [...findings];
    if (sevFilter !== "all") list = list.filter((f) => f.severity === sevFilter);
    list.sort((a, b) =>
      sort === "severity"
        ? SEV_META[a.severity].rank - SEV_META[b.severity].rank
        : a.page - b.page,
    );
    return list;
  }, [findings, sort, sevFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    findings.forEach((f) => (c[f.severity] = (c[f.severity] ?? 0) + 1));
    return c;
  }, [findings]);

  const decided = Object.values(states).filter((s) => s.disposition !== "pending").length;
  const pct = findings.length ? Math.round((decided / findings.length) * 100) : 0;

  const saveNew = () => {
    if (!newFinding.question.trim()) return;
    addReviewerFinding(newFinding);
    setNewFinding({ category: "Reviewer Note", question: "", analysis: "", page: 1 });
    setAdding(false);
  };

  if (isLoading && !findings.length) {
    return (
      <div className="pagebody" style={{ color: "var(--md-on-surface-v)" }}>
        Loading findings…
      </div>
    );
  }

  return (
    <div className="pagebody">
      <div className="ws-toolbar" style={{ justifyContent: "flex-end" }}>
        <div style={{ flex: 1 }} />
        <button className="btn btn-outline btn-sm" onClick={() => setAdding((a) => !a)}>
          <span className="material-icons">add</span>
          Add finding
        </button>
        <button className="btn btn-outline btn-sm" onClick={acceptAllPasses}>
          <span className="material-icons">done_all</span>
          Accept all passes
        </button>
        <button
          className={cn("btn btn-sm", pdfPage ? "btn-filled" : "btn-tonal")}
          onClick={() => setPdfPage((p) => (p ? null : 47))}
        >
          <span className="material-icons">picture_as_pdf</span>
          Source PDF
        </button>
      </div>

      <div className="coverage">
        <div
          className="cov-ring"
          style={{
            background: `conic-gradient(var(--md-success) 0 ${pct}%, #e4e9ee ${pct}% 100%)`,
          }}
        >
          <span>{pct}%</span>
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>
            {findings.length} findings across {Object.keys(counts).length} categories
          </div>
          <div style={{ fontSize: 12, color: "var(--md-on-surface-v)", marginTop: 2 }}>
            Accept, disagree, or reject each one. Reject sends batched corrections back to the
            appraiser.
          </div>
          <div className="cov-cats">
            {(["crit", "fail", "flag", "pass"] as Severity[]).map((s) =>
              counts[s] ? (
                <span key={s} className="cov-cat">
                  <b>{counts[s]}</b> {SEV_META[s].label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      {adding && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="field">
            <label>Issue / question</label>
            <input
              value={newFinding.question}
              onChange={(e) => setNewFinding({ ...newFinding, question: e.target.value })}
              placeholder="e.g. Comparable 3 lacks a condition adjustment"
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Detail</label>
            <textarea
              value={newFinding.analysis}
              onChange={(e) => setNewFinding({ ...newFinding, analysis: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-text btn-sm" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn btn-filled btn-sm" onClick={saveNew}>
              Add finding
            </button>
          </div>
        </div>
      )}

      <div className="ws-toolbar">
        <div className="segmented">
          <button className={cn(sort === "severity" && "on")} onClick={() => setSort("severity")}>
            By severity
          </button>
          <button className={cn(sort === "page" && "on")} onClick={() => setSort("page")}>
            By page
          </button>
        </div>
        <div className="segmented">
          <button className={cn(sevFilter === "all" && "on")} onClick={() => setSevFilter("all")}>
            All
          </button>
          {(["crit", "fail", "flag", "pass"] as Severity[]).map((s) => (
            <button key={s} className={cn(sevFilter === s && "on")} onClick={() => setSevFilter(s)}>
              {SEV_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("ws", pdfPage !== null && "with-pdf")}>
        <div>
          {sorted.map((f, i) => (
            <FindingCard
              key={f.id}
              finding={f}
              state={states[f.id] ?? { disposition: "pending" }}
              onCite={(p) => setPdfPage(p)}
              defaultOpen={i === 0 && sort === "severity"}
            />
          ))}
          {sorted.length === 0 && (
            <div
              className="card"
              style={{ padding: 32, textAlign: "center", color: "var(--md-on-surface-v)" }}
            >
              No findings match this filter.
            </div>
          )}
        </div>

        {pdfPage ? (
          <PdfPane page={pdfPage} onClose={() => setPdfPage(null)} />
        ) : (
          <WorkbookRail
            states={states}
            total={findings.length}
            onCompile={onOpenWorkbook}
          />
        )}
      </div>
    </div>
  );
}
