"use client";

import { useReviewQueue, type QueueTab } from "./hooks/useReviewQueue";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/templates/PageHeader";
import { ReviewTable, OrderButton } from "@/components/organisms";
import { Icon } from "@/components/atoms";

const TABS: { value: QueueTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "flagged", label: "Flagged" },
];

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
      <PageHeader title="My Reviews" actions={<OrderButton />} />

      <div className="pagebody">
        <div
          style={{
            background: "var(--md-surface)",
            border: "1px solid var(--md-outline-v)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
        >
          <div className="qtoolbar">
            <div className="qtabs">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  className={cn("qtab", tab === t.value && "on")}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                  <span className="cnt">{counts[t.value]}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div className="qsearch">
              <Icon name="search" size={15} />
              <input
                placeholder="Search property, loan #, bank…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div
              className="ui-seg"
              style={{ background: "transparent", border: "1px solid var(--md-outline-v)", padding: 0 }}
            >
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                style={{
                  border: "none",
                  background: "transparent",
                  font: "inherit",
                  fontSize: 13.5,
                  color: "var(--md-on-surface)",
                  padding: "8px 12px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="any">All statuses</option>
                <option value="needs_action">Needs action</option>
                <option value="running">Running</option>
                <option value="returned">Returned</option>
                <option value="completed">Completed</option>
                <option value="autorejected">Auto-rejected</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: 44, textAlign: "center", color: "var(--md-on-surface-v)" }}>
              Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center", color: "var(--md-on-surface-v)" }}>
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
        </div>
      </div>
    </>
  );
}
