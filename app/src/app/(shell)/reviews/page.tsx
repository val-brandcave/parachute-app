"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EMPTY_FILTERS, activeFilterCount, useReviewQueue } from "./hooks/useReviewQueue";
import "./reviews.css";
import { ReviewTable, ReviewTableSkeleton, OrderButton } from "@/components/organisms";
import {
  QueueFilters,
  ActiveFilters,
  EmptyState,
  EmptyLine,
  GhostRows,
} from "@/components/molecules";
import { Button, Chip } from "@/components/atoms";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { useOrgStore } from "@/store";
import { PageBody, PageHeader, SearchInput, Tabs } from "@realwired/ui";

export default function MyReviewsPage() {
  const {
    isLoading,
    isEmpty,
    sample,
    counts,
    team,
    firmOptions,
    reviews,
    total,
    tab,
    setTab,
    filters,
    setFilters,
    query,
    setQuery,
    searching,
    sort,
    cycleSort,
  } = useReviewQueue();

  const router = useRouter();
  const { locked } = useStartGate();
  const orgName = useOrgStore((s) => s.org?.name);

  // Level 1: the org has no reviews of its own yet (the sample never counts). Hide every
  // control that needs rows; the header keeps only the primary action.
  const firstRun = !isLoading && isEmpty;

  // Level 3: filtered to nothing. Name what is active and offer the way out.
  const nFilters = activeFilterCount(filters);
  const searchOnly = searching && nFilters === 0 && tab === "all";
  const clearAll = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setTab("all");
  };

  // Filter modal open state lives here so the subhead "+N more" chip can reopen it.
  const [filterOpen, setFilterOpen] = useState(false);

  // All lifecycle tabs; while searching, hide the ones with no matches (keep
  // "All" so there's always a home + a visible empty state for a no-results query).
  const allTabs = [
    { value: "all" as const, label: "All", count: counts.all },
    { value: "needs_action" as const, label: "Needs action", count: counts.needs_action },
    { value: "in_pipeline" as const, label: "In pipeline", count: counts.in_pipeline },
    // "Sent back" tab removed pending client Q1 (see client-questions doc).
    { value: "intake" as const, label: "Intake", count: counts.intake },
    { value: "completed" as const, label: "Completed", count: counts.completed },
  ];
  const visibleTabs = allTabs.filter(
    (t) => t.value === "all" || !searching || t.count > 0,
  );

  return (
    <>
      {/* Header band IS the table toolbar (no redundant title — nav says Reviews).
          Tabs partition by lifecycle stage (Ed: "separate the different stages");
          search + a Filters modal (Findings · Type pills, Reviewer · Firm
          searchable dropdowns) + the Order CTA share the one line. Active
          filters show as removable chips in a one-row subhead below ("+N more"
          reopens the modal). "Mine only" is folded into the Reviewer facet.
          With no reviews yet, only the Order CTA stays. */}
      <PageHeader
        toolbar={
          <>
            {!firstRun && (
              <Tabs
                label="Review queue"
                value={tab}
                onValueChange={setTab}
                tabs={visibleTabs}
              />
            )}
            <div style={{ flex: 1 }} />
            {!firstRun && (
              <>
                <SearchInput
                  placeholder="Search reviews…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClear={() => setQuery("")}
                />
                <QueueFilters
                  filters={filters}
                  setFilters={setFilters}
                  team={team}
                  firmOptions={firmOptions}
                  open={filterOpen}
                  onOpenChange={setFilterOpen}
                />
              </>
            )}
            <OrderButton />
          </>
        }
      />

      {!firstRun && (
        <ActiveFilters
          filters={filters}
          setFilters={setFilters}
          team={team}
          onExpand={() => setFilterOpen(true)}
        />
      )}

      <PageBody>
        {firstRun ? (
          <EmptyState
            layout="stack"
            title="No reviews yet"
            preview={<GhostRows rows={3} />}
            status={
              locked ? (
                <>
                  <b>{orgName ?? "Your organization"} is waiting for approval.</b> Start a review
                  opens once that is done.
                </>
              ) : undefined
            }
            aside={
              sample ? (
                <div className="rq-sample">
                  <span className="rq-sample-main">
                    <span className="rq-sample-addr">
                      {sample.propertyAddress}
                      <Chip tone="info">Sample</Chip>
                    </span>
                    <span className="rq-sample-meta">
                      A finished example &middot; {sample.propertyType}
                      {sample.flaggedCount > 0 && (
                        <Chip tone="flag">{sample.flaggedCount} flagged</Chip>
                      )}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/reviews/review-sample")}
                  >
                    Open the sample
                  </Button>
                </div>
              ) : null
            }
          >
            Every appraisal your team runs lands here, with its findings and due date.
          </EmptyState>
        ) : (
          <div
            style={{
              background: "var(--md-surface)",
              border: "1px solid var(--md-outline-v)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReviewTableSkeleton />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {reviews.length === 0 ? (
                    <EmptyLine
                      action={
                        <Button variant="ghost" size="sm" onClick={clearAll}>
                          {searchOnly ? "Clear search" : "Clear filters"}
                        </Button>
                      }
                    >
                      {searchOnly
                        ? `Nothing matches “${query.trim()}”`
                        : "No reviews match these filters"}
                    </EmptyLine>
                  ) : (
                    <>
                      <ReviewTable
                        reviews={reviews}
                        team={team}
                        sort={sort}
                        onSort={cycleSort}
                      />
                      <div
                        style={{
                          padding: "10px 20px",
                          fontSize: 12.5,
                          color: "var(--md-on-surface-v)",
                          borderTop: "1px solid var(--md-outline-v)",
                        }}
                      >
                        Showing {reviews.length} of {total}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </PageBody>
    </>
  );
}
