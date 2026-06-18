"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Button, Chip, Icon, Tooltip } from "@/components/atoms";
import { ActionMenu, PipelineTracker } from "@/components/molecules";
import { useOrderStore } from "@/store";
import { cn, relativeDue, formatShortDate } from "@/lib/utils";
import {
  pipelineView,
  outcomeView,
  nextActionView,
  type NextActionView,
} from "@/lib/review-lifecycle";
import {
  REVIEW_COLUMNS,
  DEFAULT_VISIBLE,
  gridTemplate,
  type ReviewColId,
  type ReviewColDef,
  type SortCol,
} from "./review-columns";
import type { Review, User } from "@/types";

type SortState = { col: SortCol; dir: "asc" | "desc" } | null;

/** Auto-rejected reviews open straight into triage; everything else to the workspace. */
export function reviewHref(r: Review) {
  return r.status === "autorejected"
    ? `/reviews/${r.id}/triage`
    : `/reviews/${r.id}`;
}

const TYPE_LABEL = { technical: "TECH", administrative: "ADMIN" } as const;

/** Review-type chips (TECH / ADMIN); "— at order" before a delivery is ordered. */
function TypeBadges({ types }: { types: Review["reviewTypes"] }) {
  if (types.length === 0) return <span className="qmuted">— at order</span>;
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

  if (a.iconOnly)
    return (
      <Tooltip content={a.label} compact>
        <Button
          size="sm"
          variant="outline"
          className="ui-btn--icon"
          iconLeft={a.icon}
          onClick={onClick}
          aria-label={a.label}
        />
      </Tooltip>
    );

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

/** Due column: a neutral date; urgency is a trailing marker — amber clock for
 *  due-soon, red triangle for overdue — whose tooltip carries the magnitude
 *  ("Due in 2d" / "Overdue 1d"). On-track = date only; auto-rejected = SLA
 *  paused; completed = no due. */
function DueCell({ review }: { review: Review }) {
  if (review.status === "autorejected")
    return <span className="duepaused">SLA paused</span>;
  if (review.status === "completed") return <span className="qmuted">—</span>;

  const due = relativeDue(review.slaDueAt);
  const warn = due.tone === "soon" || due.tone === "overdue";
  return (
    <div className="duecell">
      <span className="duedate">{formatShortDate(review.slaDueAt)}</span>
      {warn && (
        <Tooltip content={due.label}>
          <span className={cn("duemark", due.tone)} aria-label={due.label}>
            <Icon name={due.tone === "overdue" ? "warn" : "clock"} size={14} />
          </span>
        </Tooltip>
      )}
    </div>
  );
}

/** Per-row overflow — secondary/tertiary actions (Open · Download · Triage). */
function RowMenu({ review }: { review: Review }) {
  const router = useRouter();
  const items = [
    { label: "Open review", icon: "forward" as const, onClick: () => router.push(reviewHref(review)) },
    ...(review.status === "autorejected"
      ? [{ label: "Open triage", icon: "gavel" as const, onClick: () => router.push(`/reviews/${review.id}/triage`) }]
      : []),
    { label: "Download documents", icon: "download" as const, onClick: () => router.push(`/reviews/${review.id}`) },
  ];
  return <ActionMenu items={items} tooltip="More options" />;
}

/** Text that ellipsises to its column and only shows a tooltip when clipped. */
function TruncText({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [trunc, setTrunc] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTrunc(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tooltip content={text} block disabled={!trunc}>
      <span ref={ref} className={cn(className, "trunc")}>
        {text}
      </span>
    </Tooltip>
  );
}

/** Per-column cell content for a row. */
function Cell({
  col,
  r,
  team,
}: {
  col: ReviewColId;
  r: Review;
  team: Record<string, User>;
}) {
  switch (col) {
    case "property":
      return (
        <div className="qprop">
          <TruncText text={r.propertyAddress} className="addr" />
          <TruncText
            text={`${r.appraisalFirm} · Loan #${r.loanNo} · ${r.propertyType}`}
            className="meta"
          />
        </div>
      );
    case "reviewer": {
      const a = team[r.assigneeId];
      return (
        <div className="qreviewer">
          {a && (
            <Tooltip content={`${a.name} · ${a.designation}`}>
              <Avatar initials={a.initials} size={28} tone="soft" />
            </Tooltip>
          )}
        </div>
      );
    }
    case "type":
      return (
        <div>
          <TypeBadges types={r.reviewTypes} />
        </div>
      );
    case "pipeline":
      return (
        <div>
          <PipelineTracker view={pipelineView(r)} seed={r.id} />
        </div>
      );
    case "findings": {
      const o = outcomeView(r);
      return (
        <div>
          {o ? (
            <Chip tone={o.tone}>
              <Icon name={o.icon} size={13} /> {o.label}
            </Chip>
          ) : (
            <span className="qmuted">—</span>
          )}
        </div>
      );
    }
    case "due":
      return <DueCell review={r} />;
    case "actions":
      return (
        <div className="qactions" onClick={(e) => e.stopPropagation()}>
          <NextAction review={r} />
          <RowMenu review={r} />
        </div>
      );
    default:
      return null;
  }
}

/** Gear in the Actions header → portal menu to show/hide columns (locked ones
 *  stay checked + disabled). */
function ColumnConfigMenu({
  visible,
  onToggle,
}: {
  visible: Set<ReviewColId>;
  onToggle: (id: ReviewColId) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const f = () => place();
    window.addEventListener("resize", f);
    window.addEventListener("scroll", f, true);
    return () => {
      window.removeEventListener("resize", f);
      window.removeEventListener("scroll", f, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="ui-iconbtn"
        aria-label="Configure columns"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="columns" size={17} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={menuRef}
                className="qf-ms-menu colcfg-menu"
                role="menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                style={{ position: "fixed", top: pos.top, right: pos.right }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="colcfg-head">Columns</div>
                {REVIEW_COLUMNS.map((c) => {
                  const on = visible.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={cn("qf-check", on && "on", c.locked && "is-locked")}
                      role="menuitemcheckbox"
                      aria-checked={on}
                      disabled={c.locked}
                      onClick={() => !c.locked && onToggle(c.id)}
                    >
                      <span className="qf-check-box">
                        {on && <Icon name="check" size={12} />}
                      </span>
                      <span className="qf-check-name">{c.label || "Actions"}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/** Header cell — sortable label with a sort glyph, or the column-config gear
 *  for the Actions column. */
function HeaderCell({
  col,
  sort,
  onSort,
  visible,
  onToggle,
}: {
  col: ReviewColDef;
  sort: SortState;
  onSort: (col: SortCol) => void;
  visible: Set<ReviewColId>;
  onToggle: (id: ReviewColId) => void;
}) {
  if (col.id === "actions")
    return (
      <div className="qhead-actions">
        <ColumnConfigMenu visible={visible} onToggle={onToggle} />
      </div>
    );

  const active = sort?.col === col.id;
  const glyph = active ? (sort!.dir === "asc" ? "arrow-up" : "arrow-down") : "sort";
  return (
    <button
      type="button"
      className={cn(
        "qhcol",
        col.align === "center" && "qhcol--center",
        active && "is-active",
      )}
      onClick={() => onSort(col.id as SortCol)}
      aria-label={`Sort by ${col.label}`}
    >
      <span>{col.label}</span>
      <Icon name={glyph} size={13} className={cn("qsort", !active && "qsort-idle")} />
    </button>
  );
}

export function ReviewTable({
  reviews,
  team,
  sort,
  onSort,
}: {
  reviews: Review[];
  team: Record<string, User>;
  sort: SortState;
  onSort: (col: SortCol) => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState<Set<ReviewColId>>(
    () => new Set(DEFAULT_VISIBLE),
  );
  const toggleCol = (id: ReviewColId) =>
    setVisible((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const cols = REVIEW_COLUMNS.filter((c) => visible.has(c.id));
  const template = gridTemplate(visible);

  return (
    <div className="qtable">
      <div className="qcols" style={{ gridTemplateColumns: template }}>
        {cols.map((c) => (
          <HeaderCell
            key={c.id}
            col={c}
            sort={sort}
            onSort={onSort}
            visible={visible}
            onToggle={toggleCol}
          />
        ))}
      </div>
      {reviews.map((r) => (
        <div
          key={r.id}
          className="qrow"
          style={{ gridTemplateColumns: template }}
          role="link"
          tabIndex={0}
          onClick={() => router.push(reviewHref(r))}
          onKeyDown={(e) => {
            if (e.key === "Enter") router.push(reviewHref(r));
          }}
        >
          {cols.map((c) => (
            <Cell key={c.id} col={c.id} r={r} team={team} />
          ))}
        </div>
      ))}
    </div>
  );
}
