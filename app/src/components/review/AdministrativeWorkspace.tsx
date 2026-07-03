"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pipelineView } from "@/lib/review-lifecycle";
import { Button, Icon } from "@/components/atoms";
import { ActionMenu, PipelineTracker } from "@/components/molecules";
import { useAdminStore, attNeedsAttention } from "@/store";
import { useReview } from "@/store/useReview";
import { ReviewActions } from "@/components/review/ReviewChrome";
import { AttestFilterPopover, type AttFilter } from "@/components/review/AttestFilterPopover";
import { AttestCoverage } from "@/components/review/AttestCoverage";
import { AttestationList } from "@/components/review/AttestationList";
import { AttestationFocus } from "@/components/review/AttestationFocus";
import { PdfPane } from "@/components/review/PdfPane";

/**
 * Administrative Review — checklist-attestation focus-mode workspace, the
 * Technical Findings twin (locked review-details spec §4.3, decision #6). The
 * AI pre-fills the bank's checklist (built from the org-default Compliance
 * Checklist template); the reviewer attests each item — confirming or changing
 * the answer (changes need a reason) against the cited source. Three coordinated
 * surfaces: list rail · attestation focus pane · on-demand docked source PDF,
 * over a collapsible coverage band. Toolbar: Show filter · Source toggle ·
 * Confirm-routine bulk. Keyboard: j/k move the selection, y/n/x/c attest the
 * focused item (handled in `AttestationFocus`).
 */
export function AdministrativeWorkspace({
  reviewId,
  onOpenPreview,
}: {
  reviewId: string;
  onOpenPreview?: () => void;
}) {
  const { rows, states, isLoading, loadAdmin, confirmRoutine } = useAdminStore();
  const review = useReview(reviewId);

  const [filter, setFilter] = useState<AttFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [coverageOpen, setCoverageOpen] = useState(false);

  useEffect(() => {
    if (reviewId) loadAdmin(reviewId);
  }, [reviewId, loadAdmin]);

  const visible = useCallback(
    (id: string) => {
      const r = rows.find((x) => x.itemId === id);
      if (!r) return false;
      const st = states[id];
      if (filter === "attention") return attNeedsAttention(r);
      if (filter === "pending") return !st?.confirmed;
      if (filter === "attested") return !!st?.confirmed;
      return true;
    },
    [rows, states, filter],
  );

  const shown = useMemo(() => rows.filter((r) => visible(r.itemId)), [rows, visible]);

  const counts: Record<AttFilter, number> = useMemo(
    () => ({
      all: rows.length,
      attention: rows.filter((r) => attNeedsAttention(r)).length,
      pending: rows.filter((r) => !states[r.itemId]?.confirmed).length,
      attested: rows.filter((r) => states[r.itemId]?.confirmed).length,
    }),
    [rows, states],
  );

  const effectiveId = shown.some((r) => r.itemId === selectedId)
    ? selectedId
    : shown[0]?.itemId ?? null;
  const selected = shown.find((r) => r.itemId === effectiveId) ?? null;

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      const r = rows.find((x) => x.itemId === id);
      if (r && r.page > 0) setPdfPage((p) => (p !== null ? r.page : p));
    },
    [rows],
  );

  // j / k move the selection through the visible list.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== "j" && key !== "k") return;
      e.preventDefault();
      const idx = shown.findIndex((r) => r.itemId === effectiveId);
      if (idx === -1) return;
      const next = key === "j" ? Math.min(shown.length - 1, idx + 1) : Math.max(0, idx - 1);
      select(shown[next].itemId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, effectiveId, select]);

  const openSource = useCallback((page: number) => {
    setPdfPage(page);
    setCoverageOpen(false);
  }, []);

  const toggleSource = () => {
    if (pdfPage !== null) setPdfPage(null);
    else openSource(selected?.page || rows.find((r) => r.page > 0)?.page || 1);
  };

  if ((isLoading && !rows.length) || !review) {
    return <div className="fm-state text-secondary">Loading attestation…</div>;
  }

  if (review.status === "running") {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon fm-state-icon--run">
            <Icon name="ai" size={26} />
          </div>
          <h3>Pre-filling the checklist</h3>
          <p>
            Parachute is answering each checklist item against the appraisal with evidence and a
            page cite. Attestation items appear here the moment it finishes.
          </p>
          <div className="fm-state-pipe">
            <PipelineTracker view={pipelineView(review)} seed={review.id} />
          </div>
        </div>
      </div>
    );
  }

  if (review.status === "intake" || review.status === "autorejected") {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon">
            <Icon name="parachute" size={24} />
          </div>
          <h3>Administrative review not started</h3>
          <p>
            Order the Administrative review to pre-fill your bank&rsquo;s checklist with evidence and
            page cites — then attest each item and sign.
          </p>
          <Button variant="primary" iconLeft="parachute">
            Order Administrative Review
          </Button>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon">
            <Icon name="checklist" size={24} />
          </div>
          <h3>No checklist configured</h3>
          <p>
            This organization has no default Compliance Checklist published yet. Add one in
            Templates → Compliance Checklist to drive the Administrative review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fm">
      <ReviewActions>
        <AttestFilterPopover filter={filter} setFilter={setFilter} counts={counts} />
        <Button
          variant={pdfPage !== null ? "primary" : "outline"}
          size="sm"
          iconLeft="pdf"
          onClick={toggleSource}
        >
          Source
        </Button>
        <ActionMenu
          tooltip="More actions"
          items={[
            { header: true, label: "Bulk" },
            {
              label: "Confirm routine answers",
              icon: "check-all",
              onClick: confirmRoutine,
            },
          ]}
        />
      </ReviewActions>

      <div className={`fm-panes${pdfPage !== null ? " with-source" : ""}`}>
        <AttestationList
          rows={shown}
          states={states}
          selectedId={effectiveId}
          onSelect={select}
          onPreview={onOpenPreview}
        />

        <div className="fm-center">
          <AttestCoverage
            rows={rows}
            states={states}
            open={coverageOpen}
            onToggle={() => setCoverageOpen((o) => !o)}
          />

          {selected ? (
            <AttestationFocus
              key={selected.itemId}
              row={selected}
              state={states[selected.itemId] ?? { answer: selected.aiAnswer, confirmed: false }}
              onCite={openSource}
            />
          ) : (
            <div className="fm-focus fm-focus--empty text-secondary">
              Select an item to attest it.
            </div>
          )}
        </div>

        {pdfPage !== null && <PdfPane page={pdfPage} onClose={() => setPdfPage(null)} />}
      </div>
    </div>
  );
}
