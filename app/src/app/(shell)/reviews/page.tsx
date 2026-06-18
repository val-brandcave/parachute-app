"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReviewQueue } from "./hooks/useReviewQueue";
import { ReviewTable, ReviewTableSkeleton, OrderButton } from "@/components/organisms";
import { Tabs, QueueFilters, ActiveFilters } from "@/components/molecules";
import { Icon } from "@/components/atoms";

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
          search + a Filters popover (Findings · Type · Reviewer · Firm · Due) +
          the Order CTA share the one line. Active filters show as removable chips
          below. "Mine only" is folded into the Reviewer facet. */}
      <div className="pagehead">
        <Tabs value={tab} onChange={setTab} tabs={visibleTabs} />
        <div style={{ flex: 1 }} />
        <div className="qsearch">
          <Icon name="search" size={15} />
          <input
            placeholder="Search reviews…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <QueueFilters
          filters={filters}
          setFilters={setFilters}
          team={team}
          firmOptions={firmOptions}
        />
        <OrderButton />
      </div>

      <ActiveFilters filters={filters} setFilters={setFilters} team={team} />

      <div className="pagebody">
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
      </div>
    </>
  );
}
