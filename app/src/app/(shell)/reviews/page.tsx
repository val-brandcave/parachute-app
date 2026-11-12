"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  useReviewQueue,
} from "./hooks/useReviewQueue";
import "./reviews.css";
import {
  ReviewTable,
  ReviewTableSkeleton,
  OrderButton,
  FirstRunHero,
} from "@/components/organisms";
import { QueueFilters, ActiveFilters, EmptyLine } from "@/components/molecules";
import { Button } from "@/components/atoms";
import { useTourTarget } from "@/components/organisms/useTourTarget";
import { PageBody, PageHeader, SearchInput, Tabs } from "@realwired/ui";

export default function MyReviewsPage() {
  const {
    isLoading,
    isResolved,
    isEmpty,
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

  // Tour targets (spec §5.13): the first row's action cell lives inside ReviewTable.
  useTourTarget("reviews-row-action", ".qrow .qactions");

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
    {
      value: "needs_action" as const,
      label: "Needs action",
      count: counts.needs_action,
    },
    {
      value: "in_pipeline" as const,
      label: "In pipeline",
      count: counts.in_pipeline,
    },
    // "Sent back" tab removed pending client Q1 (see client-questions doc).
    { value: "intake" as const, label: "Intake", count: counts.intake },
    {
      value: "completed" as const,
      label: "Completed",
      count: counts.completed,
    },
  ];
  const visibleTabs = allTabs.filter(
    (t) => t.value === "all" || !searching || t.count > 0,
  );

  // Level 1 (the org has no reviews of its own yet; the sample never counts): just the hero,
  // no toolbar strip, no table skeleton. Until the first read lands, render nothing.
  if (!isResolved) return null;
  if (isEmpty) {
    return (
      <PageBody>
        <FirstRunHero
          title="Every figure checked against the appraisal"
          tiles={[
            {
              title: "Your team's queue",
              text: "Every review in one place, by stage: needs action, in pipeline, intake and completed.",
              ill: "05b-empty-reviews",
            },
            {
              title: "Findings at a glance",
              text: "The most serious finding on each review, with every figure traced to its page.",
              ill: "07b-finding-citation",
            },
            {
              title: "Signed and ready to send",
              text: "Due dates, overdue alerts and the signed workbook for the lender.",
              ill: "08b-signed-workbook",
            },
          ]}
        >
          Parachute traces each number in a commercial appraisal to its page and
          drafts the findings for you to concur with or reject.
        </FirstRunHero>
      </PageBody>
    );
  }

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
            <div className="rq-tourwrap" data-tour="reviews-tabs">
              <Tabs
                label="Review queue"
                value={tab}
                onValueChange={setTab}
                tabs={visibleTabs}
              />
              <div style={{ flex: 1 }} />
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
            </div>
            <span className="rq-start" data-tour="reviews-start">
              <OrderButton />
            </span>
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
      </PageBody>
    </>
  );
}
