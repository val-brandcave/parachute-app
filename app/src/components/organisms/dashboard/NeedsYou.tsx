"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip, Icon, InfoTip, type ChipTone, type IconName } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";
import { cn } from "@/lib/utils";
import { reviewHref } from "../ReviewTable";
import type { Severity } from "@/types";
import type { NeedsYou as NeedsYouData, UrgentRow } from "./insights.types";
import "./dashboard-v2-a.css";

const DAY = 86_400_000;

/** Worst finding severity → the dashboard's plain-language level. pass/na/null = clean, no chip. */
const LEVEL: Partial<Record<Severity, { label: string; tone: ChipTone; icon: IconName }>> = {
  crit: { label: "Critical", tone: "crit", icon: "crit" },
  fail: { label: "High", tone: "fail", icon: "fail" },
  flag: { label: "Medium", tone: "flag", icon: "flag" },
};

/** Due marker, same thresholds as `relativeDue` (Reviews queue Due column):
 *  overdue = red triangle, due within 2 days = amber clock, otherwise neutral.
 *  Works off the precomputed `dueInMs`, so it is pure during render. */
function dueView(ms: number): { label: string; tone: "ok" | "soon" | "overdue" } {
  if (ms < 0) return { label: `Overdue ${Math.max(1, Math.round(-ms / DAY))}d`, tone: "overdue" };
  if (ms < DAY) return { label: "Due today", tone: "soon" };
  const d = Math.round(ms / DAY);
  return { label: `Due in ${d}d`, tone: d <= 2 ? "soon" : "ok" };
}

type Tile = {
  label: string;
  value: number;
  icon: IconName;
  tip: string;
  alert?: boolean;
};

/** One stacked count tile. Reuses the StatBar segment look (`.statseg`) so the
 *  monochrome badge, the red alert state and the dark-mode glyph come for free. */
function CountTile({ t }: { t: Tile }) {
  return (
    <div className={cn("statseg dv2-tile", t.alert && "alert")}>
      <div className="statseg-main">
        <div className="k">
          {t.label}
          <InfoTip content={t.tip} />
        </div>
        <div className="v dv2-num">{t.value.toLocaleString("en-US")}</div>
      </div>
      <div className="statseg-badge">
        <Icon name={t.icon} size={22} />
      </div>
    </div>
  );
}

// DS-candidate: UrgentReviewRow — a compact review row (property / sub-line,
// worst-severity chip, due marker, one action); the Reviews queue row's little sibling.
function UrgentReviewRow({ row, onOpen }: { row: UrgentRow; onOpen: () => void }) {
  const r = row.review;
  const level = row.worst ? LEVEL[row.worst] : undefined;
  const due = dueView(row.dueInMs);
  const sub = [r.appraisalFirm, r.loanNo && `Loan #${r.loanNo}`, r.propertyType]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="dv2-urow">
      <div className="dv2-urow-main">
        <div className="t">{r.propertyAddress}</div>
        <div className="s">{sub}</div>
      </div>
      <div className="dv2-urow-sev">
        {level && (
          <Chip tone={level.tone}>
            <Icon name={level.icon} size={13} />
            {level.label}
          </Chip>
        )}
      </div>
      <div className={cn("dv2-due", due.tone)}>
        {due.tone !== "ok" && (
          <Icon name={due.tone === "overdue" ? "warn" : "clock"} size={14} />
        )}
        <span>{due.label}</span>
      </div>
      <Button size="sm" variant="outline" onClick={onOpen} aria-label={`Open ${r.propertyAddress}`}>
        Open
      </Button>
    </li>
  );
}

/**
 * Dashboard v2 · A. "Needs you" — live (not period-scoped), no section header.
 * Left: three independent stacked metric cards; right: a "Your next reviews"
 * card (title + "All in Reviews" link) with one Open action per row.
 */
export function NeedsYou({
  data,
  listTitle = "Your next reviews",
}: {
  data: NeedsYouData;
  /** Reserved: `UrgentRow.dueInMs` is already relative to now, so nothing reads this yet. */
  now?: number;
  listTitle?: string;
}) {
  const router = useRouter();

  const tiles: Tile[] = [
    {
      label: "Waiting on you",
      value: data.waiting,
      icon: "flag",
      tip: "Reviews waiting on a reviewer decision: in review, auto-rejected or past due. A live count, not affected by the period picker.",
    },
    {
      label: "Overdue",
      value: data.overdue,
      icon: "warn",
      alert: data.overdue > 0,
      tip: "Reviews past their SLA due date right now.",
    },
    {
      label: "New from YouConnect",
      value: data.newFromYc,
      icon: "connect",
      tip: "Appraisals delivered from YouConnect that haven't been started yet.",
    },
  ];

  return (
    <section className="dv2-needs" aria-label={listTitle}>
      <div className="dv2-tiles">
        {tiles.map((t) => (
          <CountTile key={t.label} t={t} />
        ))}
      </div>

      <div className="widget dv2-urgent">
        <div className="widget-head">
          <h3>{listTitle}</h3>
          <Link href="/reviews" className="link">
            All in Reviews <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <div className="widget-body">
          {data.urgent.length === 0 ? (
            <EmptyLine icon="check-circle">Nothing waiting on you</EmptyLine>
          ) : (
            <ul className="dv2-ulist">
              {data.urgent.map((row) => (
                <UrgentReviewRow
                  key={row.review.id}
                  row={row}
                  onOpen={() => router.push(reviewHref(row.review))}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
