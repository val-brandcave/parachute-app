"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { ActivityTable } from "../ActivityTable";
import { activityCsv, downloadText, type ActivityRow } from "../billing-data";

type Filter = "all" | "reviews" | "topups" | "refunds" | "rewards";

const OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reviews", label: "Reviews" },
  { value: "topups", label: "Top-ups" },
  { value: "refunds", label: "Refunds" },
  { value: "rewards", label: "Rewards" },
];
const PAGE = 25;

const bucketOf = (r: ActivityRow): Filter =>
  r.kind === "debit" || r.kind === "rescan" ? "reviews" : r.kind === "purchase" ? "topups" : r.kind === "refund" ? "refunds" : "rewards";

/** "Every credit movement": filters, person, search, CSV, and a Show more button instead of paging. */
export function LedgerSection({
  rows,
  showAmounts,
  showSource = true,
  showCredits = true,
  filters = ["all", "reviews", "topups", "refunds", "rewards"],
  people,
  onReceipt,
  title = "Every credit movement",
  filename = "parachute-credit-activity.csv",
}: {
  rows: ActivityRow[];
  showAmounts: boolean;
  showSource?: boolean;
  showCredits?: boolean;
  filters?: Filter[];
  /** Admins can narrow to one person. */
  people?: { id: string; name: string }[];
  onReceipt?: (id: string) => void;
  title?: string;
  filename?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [who, setWho] = useState("");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || bucketOf(r) === filter) &&
        (!who || r.byId === who) &&
        (!q || `${r.title} ${r.sub ?? ""} ${r.loan ?? ""}`.toLowerCase().includes(q)),
    );
  }, [rows, filter, who, query]);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setShown(PAGE);
  };
  const visible = filtered.slice(0, shown);
  const left = filtered.length - visible.length;

  return (
    <div className="bl-stack">
      <div className="bl-row bl-sechead us-sechead">
        <h2 className="bl-section">{title}</h2>
        <Button variant="outline" iconLeft="download" onClick={() => downloadText(filename, activityCsv(filtered))}>
          Export CSV
        </Button>
      </div>
      <div className="us-filters">
        {filters.length > 1 && (
          <SegmentedControl<Filter> label="Filter movements" value={filter} onChange={reset(setFilter)} options={OPTIONS.filter((o) => filters.includes(o.value))} />
        )}
        {people && people.length > 1 && (
          <div className="field us-who">
            <select aria-label="Person" value={who} onChange={(e) => reset(setWho)(e.target.value)}>
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field us-search">
          <input
            type="search"
            aria-label="Search by address or loan number"
            placeholder="Search address or loan"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
        </div>
      </div>
      <div>
        <ActivityTable
          rows={visible}
          showAmounts={showAmounts}
          showSource={showSource}
          showCredits={showCredits}
          onReceipt={onReceipt}
          label={title}
          footer={
            <span className="us-more-row">
              <span>
                Showing {visible.length} of {filtered.length} {filtered.length === 1 ? "movement" : "movements"}
              </span>
              {left > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, left)} more
                </Button>
              )}
            </span>
          }
        />
      </div>
    </div>
  );
}
