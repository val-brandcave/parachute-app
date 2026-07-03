"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SEV_META } from "@/lib/utils";
import { pipelineView } from "@/lib/review-lifecycle";
import { Button, Icon } from "@/components/atoms";
import { ActionMenu, PipelineTracker } from "@/components/molecules";
import { useWorkspaceStore, useTemplatesStore } from "@/store";
import { useReview } from "@/store/useReview";
import { CoveragePanel } from "@/components/review/CoveragePanel";
import { ReviewActions } from "@/components/review/ReviewChrome";
import { FilterSortPopover, type Sort, type SevFilter } from "@/components/review/FilterSortPopover";
import { FindingList } from "@/components/review/FindingList";
import { FindingFocus } from "@/components/review/FindingFocus";
import { PdfPane } from "@/components/review/PdfPane";
import { AddFindingModal } from "@/components/review/AddFindingModal";

/**
 * Technical Review — Findings focus-mode workspace. Three coordinated surfaces:
 * a navigable list rail, a single-finding focus pane, and an on-demand docked
 * source PDF (the third pane appears only when a page is cited / Source is
 * toggled). A collapsible coverage panel proves the pipeline's reach; the
 * toolbar is consolidated to a Filter-&-sort popover + Source toggle + Add +
 * overflow. Keyboard: j/k move the selection, a/o/r/c disposition the focused
 * finding (handled in `FindingFocus`). Rendered as the Technical tab's default
 * sub-view, not a route.
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
  const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
  const review = useReview(reviewId);

  const [sort, setSort] = useState<Sort>("severity");
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // Coverage is a slim header band over the focus column — collapsed by default;
  // opening the Source PDF auto-collapses it so the finding text keeps its height.
  const [coverageOpen, setCoverageOpen] = useState(false);

  useEffect(() => {
    if (reviewId) loadReview(reviewId);
  }, [reviewId, loadReview]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

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

  // The effective selection is derived, never effect-synced: honour the user's
  // pick while it's still in the visible list, otherwise fall back to the top.
  const effectiveId = sorted.some((f) => f.id === selectedId)
    ? selectedId
    : sorted[0]?.id ?? null;
  const selected = sorted.find((f) => f.id === effectiveId) ?? null;

  // Selecting a finding; if the source dock is open, follow it to that finding's page.
  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      const f = findings.find((x) => x.id === id);
      if (f) setPdfPage((p) => (p !== null ? f.page : p));
    },
    [findings],
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
      const idx = sorted.findIndex((f) => f.id === effectiveId);
      if (idx === -1) return;
      const next = key === "j" ? Math.min(sorted.length - 1, idx + 1) : Math.max(0, idx - 1);
      select(sorted[next].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sorted, effectiveId, select]);

  // Opening the source dock collapses the coverage band so the focus + PDF keep
  // their height (the 3rd column is full-height on its own).
  const openSource = useCallback((page: number) => {
    setPdfPage(page);
    setCoverageOpen(false);
  }, []);

  const toggleSource = () => {
    if (pdfPage !== null) setPdfPage(null);
    else openSource(selected?.page ?? findings[0]?.page ?? 1);
  };

  if ((isLoading && !findings.length) || !review) {
    return <div className="fm-state text-secondary">Loading findings…</div>;
  }

  // State-adaptive body: running pipeline / empty intake / clean / active.
  if (review.status === "running") {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon fm-state-icon--run">
            <Icon name="ai" size={26} />
          </div>
          <h3>Running the review pipeline</h3>
          <p>
            Parachute is working through the five-stage technical pipeline. Findings appear here
            the moment it finishes.
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
          <h3>Technical review not started</h3>
          <p>
            This appraisal hasn’t been run through the technical pipeline yet. Order it to generate
            findings for disposition.
          </p>
          <Button variant="primary" iconLeft="parachute">
            Order Technical Review
          </Button>
        </div>
      </div>
    );
  }

  if (!findings.length) {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon fm-state-icon--ok">
            <Icon name="check-circle" size={26} />
          </div>
          <h3>No technical findings</h3>
          <p>The pipeline completed without raising any findings on this report — a clean pass.</p>
          <Button variant="outline" iconLeft="document" onClick={onOpenWorkbook}>
            Go to Workbook
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fm">
      <ReviewActions>
        <FilterSortPopover
          sort={sort}
          setSort={setSort}
          sevFilter={sevFilter}
          setSevFilter={setSevFilter}
          counts={counts}
        />
        <Button
          variant={pdfPage !== null ? "primary" : "outline"}
          size="sm"
          iconLeft="pdf"
          onClick={toggleSource}
        >
          Source
        </Button>
        <Button variant="outline" size="sm" iconLeft="add" onClick={() => setAddOpen(true)}>
          Add finding
        </Button>
        <ActionMenu
          tooltip="More actions"
          items={[
            { header: true, label: "Bulk" },
            { label: "Accept all passing checks", icon: "check-all", onClick: acceptAllPasses },
          ]}
        />
      </ReviewActions>

      <div className={`fm-panes${pdfPage !== null ? " with-source" : ""}`}>
        <FindingList
          findings={sorted}
          states={states}
          selectedId={effectiveId}
          onSelect={select}
          total={findings.length}
          onCompile={onOpenWorkbook}
        />

        <div className="fm-center">
          <CoveragePanel
            findings={findings}
            states={states}
            open={coverageOpen}
            onToggle={() => setCoverageOpen((o) => !o)}
          />

          {selected ? (
            <FindingFocus
              key={selected.id}
              finding={selected}
              state={states[selected.id] ?? { disposition: "pending" }}
              property={review.propertyAddress}
              onCite={openSource}
            />
          ) : (
            <div className="fm-focus fm-focus--empty text-secondary">
              Select a finding to review it.
            </div>
          )}
        </div>

        {pdfPage !== null && <PdfPane page={pdfPage} onClose={() => setPdfPage(null)} />}
      </div>

      <AddFindingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(f) => {
          addReviewerFinding(f);
          setAddOpen(false);
        }}
      />
    </div>
  );
}
