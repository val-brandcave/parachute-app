"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/current-user";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  type QueueFilters as Filters,
  type MultiSel,
} from "@/app/(shell)/reviews/hooks/useReviewQueue";
import type { User } from "@/types";

type MSOption = {
  value: string;
  label: string;
  initials?: string;
  tag?: string;
  icon?: IconName;
  iconTone?: string;
};

/* ---- static facet options (Findings keeps its severity color cues) ---- */

const FINDINGS_OPTS: MSOption[] = [
  { value: "crit", label: "Critical", icon: "crit", iconTone: "crit" },
  { value: "fail", label: "Fail", icon: "fail", iconTone: "fail" },
  { value: "flag", label: "Flagged", icon: "flag", iconTone: "flag" },
  { value: "clean", label: "Clean", icon: "check-circle", iconTone: "pass" },
];

const TYPE_OPTS: MSOption[] = [
  { value: "technical", label: "Technical" },
  { value: "administrative", label: "Administrative" },
];

const DUE_OPTS: MSOption[] = [
  { value: "overdue", label: "Overdue" },
  { value: "soon", label: "Due soon (≤2d)" },
  { value: "paused", label: "SLA paused" },
];

const labelOf = (opts: MSOption[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? v;

/** Toggle a value in/out of a multi-select array. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ============================================================= *
 *  MultiSelect — the shared filter dropdown (tri-state select-all)
 * ============================================================= */

/**
 * A select-styled trigger (summary + chevron) that opens a portal checkbox
 * menu. Tri-state: the "All" row toggles select-all ("all") ↔ deselect-all
 * ([]); a full selection collapses back to "all"; [] = none. Portaled so the
 * parent popover's scroll can't clip it; mousedown is stopped so ticking a box
 * never dismisses the parent popover.
 */
function MultiSelect({
  placeholder,
  options,
  selected,
  onChange,
}: {
  placeholder: string;
  options: MSOption[];
  selected: MultiSel;
  onChange: (next: MultiSel) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
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
        ref.current?.contains(e.target as Node) ||
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

  const allValues = options.map((o) => o.value);
  const allOn = selected === "all";
  const picked: string[] = selected === "all" ? [] : selected; // explicit set

  // "All" row = plain toggle: select-all ("all") ↔ deselect-all ([]).
  const toggleAll = () => onChange(allOn ? [] : "all");

  // Toggle one value against the effective set; a full result collapses to
  // "all", an empty result stays [] (none) — so deselect-all really clears.
  const handleToggle = (value: string) => {
    const eff = allOn ? allValues : selected;
    const next = toggle(eff, value);
    onChange(next.length === allValues.length ? "all" : next);
  };

  const soloOpt =
    picked.length === 1 ? options.find((o) => o.value === picked[0]) : undefined;
  const summary = allOn
    ? placeholder
    : picked.length === 0
      ? "None"
      : picked.length === 1
        ? (soloOpt?.label ?? "1 selected")
        : `${picked.length} selected`;

  type RowState = "on" | "off" | "mixed";
  const row = (
    key: string,
    state: RowState,
    label: string,
    onClick: () => void,
    extra?: Pick<MSOption, "initials" | "tag" | "icon" | "iconTone">,
  ) => (
    <button
      key={key}
      type="button"
      className={cn("qf-check", state === "on" && "on", state === "mixed" && "mixed")}
      role="menuitemcheckbox"
      aria-checked={state === "mixed" ? "mixed" : state === "on"}
      onClick={onClick}
    >
      <span className="qf-check-box">
        {state === "on" && <Icon name="check" size={12} />}
        {state === "mixed" && <Icon name="na" size={12} />}
      </span>
      {extra?.icon && (
        <Icon
          name={extra.icon}
          size={15}
          className={cn("qf-ic", extra.iconTone && `qf-ic--${extra.iconTone}`)}
        />
      )}
      {extra?.initials && <Avatar initials={extra.initials} size={22} tone="soft" />}
      <span className="qf-check-name">{label}</span>
      {extra?.tag && <span className="qf-check-you">{extra.tag}</span>}
    </button>
  );

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="qf-select qf-select--btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={cn(
            "qf-select-val",
            allOn && "muted",
            soloOpt?.iconTone && `qf-ic--${soloOpt.iconTone}`,
          )}
        >
          {summary}
        </span>
        <Icon name="chevron-down" size={15} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={menuRef}
                className="qf-ms-menu"
                role="listbox"
                aria-multiselectable
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {row(
                  "__all",
                  allOn ? "on" : picked.length === 0 ? "off" : "mixed",
                  placeholder,
                  toggleAll,
                )}
                {options.map((o) =>
                  row(
                    o.value,
                    allOn || picked.includes(o.value) ? "on" : "off",
                    o.label,
                    () => handleToggle(o.value),
                    o,
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ============================================================= *
 *  Filters button + popover (staged draft, committed on Apply)
 * ============================================================= */

export function QueueFilters({
  filters,
  setFilters,
  team,
  firmOptions,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  team: Record<string, User>;
  firmOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const count = activeFilterCount(filters);

  // Open: seed the draft from committed filters and anchor under the button.
  const openPop = () => {
    setDraft(filters);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const reposition = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  // Outside-click / Escape dismiss (cancels — draft is discarded).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        popRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
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

  const apply = () => {
    setFilters(draft);
    setOpen(false);
  };
  const clear = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const reviewerOpts: MSOption[] = Object.values(team).map((u) => ({
    value: u.id,
    label: u.name,
    initials: u.initials,
    tag: u.id === CURRENT_USER.id ? "You" : undefined,
  }));
  const firmOpts: MSOption[] = firmOptions.map((f) => ({ value: f, label: f }));

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={cn("qf-btn", (open || count > 0) && "on")}
        onClick={() => (open ? setOpen(false) : openPop())}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="filter" size={15} />
        Filters
        {count > 0 && <span className="qf-badge">{count}</span>}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={popRef}
                className="qf-pop"
                role="dialog"
                aria-label="Filter reviews"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.13 }}
                style={{ position: "fixed", top: pos.top, right: pos.right }}
              >
                <div className="qf-sec">
                  <div className="qf-sec-label">Findings</div>
                  <MultiSelect
                    placeholder="All findings"
                    options={FINDINGS_OPTS}
                    selected={draft.findings}
                    onChange={(next) => setDraft({ ...draft, findings: next })}
                  />
                </div>

                <div className="qf-sec">
                  <div className="qf-sec-label">Type</div>
                  <MultiSelect
                    placeholder="All types"
                    options={TYPE_OPTS}
                    selected={draft.types}
                    onChange={(next) => setDraft({ ...draft, types: next })}
                  />
                </div>

                <div className="qf-sec">
                  <div className="qf-sec-label">Reviewer</div>
                  <MultiSelect
                    placeholder="All reviewers"
                    options={reviewerOpts}
                    selected={draft.reviewers}
                    onChange={(next) => setDraft({ ...draft, reviewers: next })}
                  />
                </div>

                <div className="qf-sec">
                  <div className="qf-sec-label">Appraisal firm</div>
                  <MultiSelect
                    placeholder="All firms"
                    options={firmOpts}
                    selected={draft.firms}
                    onChange={(next) => setDraft({ ...draft, firms: next })}
                  />
                </div>

                <div className="qf-sec">
                  <div className="qf-sec-label">Due</div>
                  <MultiSelect
                    placeholder="All due dates"
                    options={DUE_OPTS}
                    selected={draft.due}
                    onChange={(next) => setDraft({ ...draft, due: next })}
                  />
                </div>

                <div className="qf-foot">
                  <button type="button" className="qf-clear" onClick={clear}>
                    Clear all
                  </button>
                  <button type="button" className="qf-apply" onClick={apply}>
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ============================================================= *
 *  Active-filter chip strip (removable; only renders when filtering)
 * ============================================================= */

export function ActiveFilters({
  filters,
  setFilters,
  team,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  team: Record<string, User>;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // A facet contributes: nothing when "all", a "None" chip when [], else one
  // removable chip per selected value. (All-selected collapses to "all" in the
  // dropdown, so "everything selected" never shows chips — the thumb rule.)
  const facetChips = (
    sel: MultiSel,
    prefix: string,
    noneLabel: string,
    label: (v: string) => string,
    set: (next: MultiSel) => void,
  ) => {
    if (sel === "all") return;
    if (sel.length === 0) {
      chips.push({ key: `${prefix}-none`, label: noneLabel, onRemove: () => set("all") });
      return;
    }
    for (const v of sel)
      chips.push({
        key: `${prefix}-${v}`,
        label: label(v),
        onRemove: () => set(sel.filter((x) => x !== v)),
      });
  };

  facetChips(
    filters.findings,
    "find",
    "No findings",
    (v) => labelOf(FINDINGS_OPTS, v),
    (next) => setFilters({ ...filters, findings: next }),
  );
  facetChips(
    filters.types,
    "type",
    "No types",
    (v) => labelOf(TYPE_OPTS, v),
    (next) => setFilters({ ...filters, types: next }),
  );
  facetChips(
    filters.reviewers,
    "rev",
    "No reviewers",
    (id) => team[id]?.name ?? "Reviewer",
    (next) => setFilters({ ...filters, reviewers: next }),
  );
  facetChips(
    filters.firms,
    "firm",
    "No firms",
    (v) => v,
    (next) => setFilters({ ...filters, firms: next }),
  );
  facetChips(
    filters.due,
    "due",
    "No due dates",
    (v) => labelOf(DUE_OPTS, v),
    (next) => setFilters({ ...filters, due: next }),
  );

  if (chips.length === 0) return null;

  return (
    <div className="qf-chips">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="qf-chip"
          onClick={c.onRemove}
          aria-label={`Remove filter: ${c.label}`}
        >
          {c.label}
          <Icon name="close" size={13} />
        </button>
      ))}
      <button
        type="button"
        className="qf-chip-clear"
        onClick={() => setFilters(EMPTY_FILTERS)}
      >
        Clear all
      </button>
    </div>
  );
}
