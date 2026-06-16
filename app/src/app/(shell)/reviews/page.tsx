"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReviewQueue } from "./hooks/useReviewQueue";
import { ReviewTable, ReviewTableSkeleton, OrderButton } from "@/components/organisms";
import { Tabs } from "@/components/molecules";
import { Icon } from "@/components/atoms";

export default function MyReviewsPage() {
  const {
    isLoading,
    counts,
    reviews,
    total,
    tab,
    setTab,
    query,
    setQuery,
    status,
    setStatus,
  } = useReviewQueue();

  return (
    <>
      {/* Header band IS the table toolbar (no redundant title — nav says Reviews) */}
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All", count: counts.all },
            { value: "mine", label: "Mine", count: counts.mine },
            { value: "flagged", label: "Flagged", count: counts.flagged },
          ]}
        />
        <div style={{ flex: 1 }} />
        <div className="qsearch">
          <Icon name="search" size={15} />
          <input
            placeholder="Search property, loan #, bank…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="qfilter"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label="Filter by status"
        >
          <option value="any">All statuses</option>
          <option value="needs_action">Needs action</option>
          <option value="running">Running</option>
          <option value="returned">Returned</option>
          <option value="completed">Completed</option>
          <option value="autorejected">Auto-rejected</option>
        </select>
        <OrderButton />
      </div>

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
                  <ReviewTable reviews={reviews} />
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
