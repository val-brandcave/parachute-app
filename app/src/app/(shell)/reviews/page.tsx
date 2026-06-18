"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReviewQueue } from "./hooks/useReviewQueue";
import { ReviewTable, ReviewTableSkeleton, OrderButton } from "@/components/organisms";
import { Tabs } from "@/components/molecules";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";

export default function MyReviewsPage() {
  const {
    isLoading,
    counts,
    team,
    reviews,
    total,
    tab,
    setTab,
    mineOnly,
    setMineOnly,
    severity,
    setSeverity,
    query,
    setQuery,
  } = useReviewQueue();

  return (
    <>
      {/* Header band IS the table toolbar (no redundant title — nav says Reviews).
          Tabs partition by lifecycle stage (Ed: "separate the different stages");
          Mine-only + severity + search are the filter set. */}
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All", count: counts.all },
            { value: "needs_action", label: "Needs action", count: counts.needs_action },
            { value: "in_pipeline", label: "In pipeline", count: counts.in_pipeline },
            { value: "sent_back", label: "Sent back", count: counts.sent_back },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "intake", label: "Intake", count: counts.intake },
          ]}
        />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className={cn("qtoggle", mineOnly && "on")}
          onClick={() => setMineOnly(!mineOnly)}
          aria-pressed={mineOnly}
        >
          <Icon name={mineOnly ? "check" : "user"} size={14} />
          Mine only
        </button>
        <div className="qsearch">
          <Icon name="search" size={15} />
          <input
            placeholder="Search property, loan #, firm…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="qfilter"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as typeof severity)}
          aria-label="Filter by severity"
        >
          <option value="any">Any severity</option>
          <option value="crit">Critical</option>
          <option value="fail">Fail</option>
          <option value="flag">Flagged</option>
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
                  <ReviewTable reviews={reviews} team={team} />
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
