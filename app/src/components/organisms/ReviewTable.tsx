"use client";

import { useRouter } from "next/navigation";
import { Avatar, Button, Chip, Icon, Tooltip } from "@/components/atoms";
import { ActionMenu, PipelineTracker } from "@/components/molecules";
import { useOrderStore } from "@/store";
import { cn, relativeDue } from "@/lib/utils";
import {
  pipelineView,
  outcomeView,
  nextActionView,
  type NextActionView,
} from "@/lib/review-lifecycle";
import type { Review, User } from "@/types";

/** Auto-rejected reviews open straight into triage; everything else to the workspace. */
export function reviewHref(r: Review) {
  return r.status === "autorejected"
    ? `/reviews/${r.id}/triage`
    : `/reviews/${r.id}`;
}

const TYPE_LABEL = { technical: "TECH", administrative: "ADMIN" } as const;

/** Review-type pills (TECH / ADMIN); "— at order" before a delivery is ordered. */
function TypeBadges({ types }: { types: Review["reviewTypes"] }) {
  if (types.length === 0)
    return <span className="qmuted">— at order</span>;
  return (
    <span className="tbadges">
      {types.map((t) => (
        <span key={t} className={`tbadge tbadge--${t === "technical" ? "t" : "a"}`}>
          {TYPE_LABEL[t]}
        </span>
      ))}
    </span>
  );
}

/** Derived primary action per row. `kind` decides how it's wired. */
function NextAction({ review }: { review: Review }) {
  const router = useRouter();
  const openOrder = useOrderStore((s) => s.openOrder);
  const a: NextActionView = nextActionView(review);

  if (a.tone === "quiet")
    return (
      <span className="nextact-quiet">
        {a.icon && <Icon name={a.icon} size={14} />}
        {a.label}
      </span>
    );

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (a.kind === "order")
      openOrder({
        step: 4,
        prefill: {
          reviewId: review.id,
          source: review.source,
          propertyAddress: review.propertyAddress,
          loanNo: review.loanNo,
          bank: review.bank,
        },
      });
    else router.push(a.href ?? reviewHref(review));
  };

  return (
    <Button
      size="sm"
      variant="outline"
      iconLeft={a.icon}
      iconRight={a.iconRight}
      onClick={onClick}
    >
      {a.label}
    </Button>
  );
}

/** Per-row overflow — secondary/tertiary actions (Open · Download · Triage). */
function RowMenu({ review }: { review: Review }) {
  const router = useRouter();
  const items = [
    { label: "Open review", icon: "forward" as const, onClick: () => router.push(reviewHref(review)) },
    ...(review.status === "autorejected"
      ? [{ label: "Open triage", icon: "warn" as const, onClick: () => router.push(`/reviews/${review.id}/triage`) }]
      : []),
    { label: "Download documents", icon: "download" as const, onClick: () => router.push(`/reviews/${review.id}`) },
  ];
  return <ActionMenu items={items} />;
}

export function ReviewTable({
  reviews,
  team,
}: {
  reviews: Review[];
  team: Record<string, User>;
}) {
  const router = useRouter();
  return (
    <div className="qtable">
      <div className="qcols">
        <div>Property &amp; parties</div>
        <div>Type</div>
        <div>Pipeline</div>
        <div>Findings</div>
        <div>Due</div>
        <div>Next action</div>
        <div />
      </div>
      {reviews.map((r) => {
        const due = relativeDue(r.slaDueAt);
        const outcome = outcomeView(r);
        const assignee = team[r.assigneeId];
        const showDue = r.status !== "completed" && r.status !== "autorejected";
        return (
          <div
            key={r.id}
            className="qrow"
            role="link"
            tabIndex={0}
            onClick={() => router.push(reviewHref(r))}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(reviewHref(r));
            }}
          >
            <div className="qprop">
              {assignee && (
                <Tooltip content={`${assignee.name} · ${assignee.designation}`}>
                  <Avatar initials={assignee.initials} size={28} tone="soft" />
                </Tooltip>
              )}
              <div style={{ minWidth: 0 }}>
                <div className="addr">{r.propertyAddress}</div>
                <div className="meta">
                  {r.appraisalFirm} · Loan #{r.loanNo} · {r.propertyType}
                </div>
              </div>
            </div>

            <div>
              <TypeBadges types={r.reviewTypes} />
            </div>

            <div>
              <PipelineTracker view={pipelineView(r)} />
            </div>

            <div>
              {outcome ? (
                <Chip tone={outcome.tone}>
                  <Icon name={outcome.icon} size={13} /> {outcome.label}
                </Chip>
              ) : (
                <span className="qmuted">—</span>
              )}
            </div>

            <div className={cn("due2", showDue && due.tone !== "ok" && due.tone)}>
              {r.status === "autorejected"
                ? "SLA paused"
                : showDue
                  ? due.label
                  : "—"}
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <NextAction review={r} />
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <RowMenu review={r} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
