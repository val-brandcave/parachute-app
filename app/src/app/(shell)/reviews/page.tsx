"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReviewQueue } from "./hooks/useReviewQueue";
import { ReviewTable, ReviewTableSkeleton, OrderButton } from "@/components/organisms";
import { QueueFilters, ActiveFilters } from "@/components/molecules";
import { PageBody, PageHeader, SearchInput, Tabs } from "@realwired/ui";

export default function MyReviewsPage() {
  const {
    isLoading,
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
          reopens the modal). "Mine only" is folded into the Reviewer facet. */}
      {/* The page band is now the library's. Parachute keeps its own toolbar
          CONTENTS — the filter modal and the Order CTA are product logic — and
          gets the band, the tabs and the search field from @realwired/ui. */}
      <PageHeader
        toolbar={
          <>
            <Tabs
              label="Review queue"
              value={tab}
              onValueChange={setTab}
              tabs={visibleTabs}
            />
            <div style={{ flex: 1 }} />
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
            <OrderButton />
          </>
        }
      />

      <ActiveFilters
        filters={filters}
        setFilters={setFilters}
        team={team}
        onExpand={() => setFilterOpen(true)}
      />

      <PageBody>
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
                  <div
                    style={{
                      padding: 44,
                      textAlign: "center",
                      color: "var(--md-on-surface-v)",
                    }}
                  >
                    No reviews match your filters.
                  </div>
                ) : (
                  <ReviewTable
                    reviews={reviews}
                    team={team}
                    sort={sort}
                    onSort={cycleSort}
                  />
                )}

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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageBody>
    </>
  );
}
