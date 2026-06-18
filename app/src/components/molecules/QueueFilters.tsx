"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Icon, IconButton, type IconName } from "@/components/atoms";
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

const labelOf = (opts: MSOption[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? v;

/** Toggle a value in/out of a multi-select array. */
function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ============================================================= *
 *  FacetPills — small, fixed-option facets as inline toggle pills
 * ============================================================= *
 *
 * For bounded enumerable facets (Findings, Type, Due) pills are faster than a
 * dropdown — every option is visible and one tap away. Tri-state MultiSel:
 *   • "all"  → the "All …" pill is filled, options neutral  (no filter)
 *   • subset → those option pills filled
 *   • []     → nothing filled (none — surfaces a "No …" chip in the subhead)
 * Picking an option while "all" starts a fresh single-value selection; selecting
 * every option collapses back to "all" (thumb rule: all-selected == default).
 */
function FacetPills({
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
  const allValues = options.map((o) => o.value);
  const allOn = selected === "all";
  const picked: string[] = allOn ? [] : selected;

  const reset = () => onChange("all");
  const handleToggle = (value: string) => {
    if (allOn) {
      onChange([value]);
      return;
    }
    const next = toggle(selected, value);
    onChange(next.length === allValues.length ? "all" : next);
  };

  return (
    <div className="qf-opts">
      <button
        type="button"
        className={cn("qf-opt qf-opt--all", allOn && "on")}
        aria-pressed={allOn}
        onClick={reset}
      >
        {placeholder}
      </button>
      {options.map((o) => {
        const on = !allOn && picked.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className={cn("qf-opt", o.iconTone && `qf-opt--${o.iconTone}`, on && "on")}
            aria-pressed={on}
            onClick={() => handleToggle(o.value)}
          >
            {o.icon && (
              <Icon
                name={o.icon}
                size={14}
                className={cn("qf-ic", o.iconTone && `qf-ic--${o.iconTone}`)}
              />
            )}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================= *
 *  MultiSelectField — large, open-ended facets as a searchable
 *  multi-select dropdown (Reviewer, Appraisal firm)
 * ============================================================= *
 *
 * Pills don't scale to dozens of reviewers/firms, so these facets use a
 * select-styled trigger that opens a portal menu with a search box + checkbox
 * rows. Tri-state: the "All" row toggles select-all ("all") ↔ deselect-all ([]);
 * a full selection collapses back to "all". The menu is portaled above the modal
 * (z-index) and repositions on scroll; Esc closes the menu only (not the modal).
 */
function MultiSelectField({
  placeholder,
  options,
  selected,
  onChange,
  searchPlaceholder,
}: {
  placeholder: string;
  options: MSOption[];
  selected: MultiSel;
  onChange: (next: MultiSel) => void;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (
        ref.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    // Capture-phase so Esc closes the dropdown only — it never reaches the
    // modal's own bubble-phase Esc handler (which would close the whole modal).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const allValues = options.map((o) => o.value);
  const allOn = selected === "all";
  const picked: string[] = allOn ? [] : selected;

  const toggleAll = () => onChange(allOn ? [] : "all");
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

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle))
    : options;

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
        <span className={cn("qf-select-val", allOn && "muted")}>{summary}</span>
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
                <div className="qf-search">
                  <Icon name="search" size={15} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={q}
                    placeholder={searchPlaceholder ?? "Search…"}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="qf-checks">
                  {!needle &&
                    row(
                      "__all",
                      allOn ? "on" : picked.length === 0 ? "off" : "mixed",
                      placeholder,
                      toggleAll,
                    )}
                  {filtered.map((o) =>
                    row(
                      o.value,
                      allOn || picked.includes(o.value) ? "on" : "off",
                      o.label,
                      () => handleToggle(o.value),
                      o,
                    ),
                  )}
                  {filtered.length === 0 && (
                    <div className="qf-ms-empty">No matches</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* small labelled wrapper around a facet control inside the modal */
function Facet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="qf-facet">
      <div className="qf-facet-head">
        <span className="qf-facet-label">{label}</span>
      </div>
      {children}
    </div>
  );
}

/* ============================================================= *
 *  QueueFilters — Filters button + filter modal (staged draft)
 * ============================================================= *
 *
 * `open` is controlled by the page so the subhead's "+N more" chip can reopen
 * the modal. Small fixed facets render as inline pills; large open-ended facets
 * (Reviewer, Firm) render as searchable multi-select dropdowns. Selections edit a
 * draft and only commit on Apply; X / Esc / backdrop cancel and discard the draft.
 */
export function QueueFilters({
  filters,
  setFilters,
  team,
  firmOptions,
  open,
  onOpenChange,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  team: Record<string, User>;
  firmOptions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  const [wasOpen, setWasOpen] = useState(open);
  const count = activeFilterCount(filters);
  const draftCount = activeFilterCount(draft);

  // Seed the draft from the committed filters on the closed→open transition
  // (React's "adjust state during render" pattern — no effect, no cascading
  // render). Filters can't change while the modal is up, so seeding only on open
  // is correct; X / Esc / backdrop discard the draft.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  // Esc closes the modal (cancel). Dropdowns swallow Esc first (capture phase).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const apply = () => {
    setFilters(draft);
    onOpenChange(false);
  };
  const clearDraft = () => setDraft(EMPTY_FILTERS);

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
        type="button"
        className={cn("qf-btn", (open || count > 0) && "on")}
        onClick={() => onOpenChange(!open)}
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
            {open && (
              <motion.div
                className="ui-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) =>
                  e.target === e.currentTarget && onOpenChange(false)
                }
              >
                <motion.div
                  className="qf-modal"
                  role="dialog"
                  aria-label="Filter reviews"
                  initial={{ opacity: 0, y: 16, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.99 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="qf-modal-head">
                    <h2>Filter reviews</h2>
                    <IconButton
                      name="close"
                      onClick={() => onOpenChange(false)}
                      aria-label="Close"
                    />
                  </div>

                  <div className="qf-modal-body scroll">
                    <Facet label="Findings">
                      <FacetPills
                        placeholder="All findings"
                        options={FINDINGS_OPTS}
                        selected={draft.findings}
                        onChange={(next) => setDraft({ ...draft, findings: next })}
                      />
                    </Facet>
                    <Facet label="Type">
                      <FacetPills
                        placeholder="All types"
                        options={TYPE_OPTS}
                        selected={draft.types}
                        onChange={(next) => setDraft({ ...draft, types: next })}
                      />
                    </Facet>
                    <Facet label="Reviewer">
                      <MultiSelectField
                        placeholder="All reviewers"
                        options={reviewerOpts}
                        selected={draft.reviewers}
                        onChange={(next) => setDraft({ ...draft, reviewers: next })}
                        searchPlaceholder="Search reviewers…"
                      />
                    </Facet>
                    <Facet label="Appraisal firm">
                      <MultiSelectField
                        placeholder="All firms"
                        options={firmOpts}
                        selected={draft.firms}
                        onChange={(next) => setDraft({ ...draft, firms: next })}
                        searchPlaceholder="Search firms…"
                      />
                    </Facet>
                  </div>

                  <div className="qf-modal-foot">
                    <button
                      type="button"
                      className="qf-clear"
                      onClick={clearDraft}
                      disabled={draftCount === 0}
                    >
                      Clear all
                    </button>
                    <button type="button" className="qf-apply" onClick={apply}>
                      {draftCount > 0 ? `Apply (${draftCount})` : "Apply"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ============================================================= *
 *  ActiveFilters — removable chip strip in the table subhead
 * ============================================================= *
 *
 * One row only: chips that don't fit collapse into a "+N more" pill that reopens
 * the filter modal (via onExpand). Overflow is measured off-screen so the visible
 * row never wraps or flickers.
 */
type Chip = { key: string; label: string; onRemove: () => void };

export function ActiveFilters({
  filters,
  setFilters,
  team,
  onExpand,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  team: Record<string, User>;
  onExpand: () => void;
}) {
  const chips: Chip[] = [];

  // A facet contributes: nothing when "all", a "None" chip when [], else one
  // removable chip per selected value. (All-selected collapses to "all" in the
  // modal, so "everything selected" never shows chips — the thumb rule.)
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

  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(chips.length);
  const chipsKey = chips.map((c) => c.key).join("|");

  // Measure off-screen: how many chips fit on one row, reserving room for the
  // "+N more" pill and the trailing "Clear all".
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const recompute = () => {
      const avail = row.clientWidth;
      const kids = Array.from(measure.children) as HTMLElement[];
      const n = chips.length;
      const chipEls = kids.slice(0, n);
      const moreW = kids[n]?.offsetWidth ?? 80;
      const clearW = kids[n + 1]?.offsetWidth ?? 64;
      const gap = 8;

      // Fast path: do all chips + "Clear all" fit without needing a "+more" pill?
      const totalAll =
        chipEls.reduce((s, el) => s + el.offsetWidth, 0) + gap * n + clearW;
      if (totalAll <= avail) {
        setVisible(n);
        return;
      }

      // Otherwise reserve space for the "+N more" pill.
      let used = clearW;
      let fit = 0;
      for (let i = 0; i < n; i++) {
        const w = chipEls[i].offsetWidth;
        if (used + gap + w + gap + moreW <= avail) {
          used += gap + w;
          fit++;
        } else break;
      }
      setVisible(fit);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(row);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsKey]);

  if (chips.length === 0) return null;
  const hidden = Math.max(0, chips.length - visible);

  const chipEl = (c: Chip, onClick: () => void) => (
    <button
      key={c.key}
      type="button"
      className="qf-chip"
      onClick={onClick}
      aria-label={`Remove filter: ${c.label}`}
    >
      {c.label}
      <Icon name="close" size={13} />
    </button>
  );

  return (
    <div className="qf-chips">
      {/* hidden measurement row — all chips + spacers on one line */}
      <div className="qf-chips-measure" ref={measureRef} aria-hidden>
        {chips.map((c) => (
          <span key={c.key} className="qf-chip">
            {c.label}
            <Icon name="close" size={13} />
          </span>
        ))}
        <span className="qf-chip qf-chip--more">+{chips.length} more</span>
        <span className="qf-chip-clear">Clear all</span>
      </div>

      <div className="qf-chips-row" ref={rowRef}>
        {chips.slice(0, visible).map((c) => chipEl(c, c.onRemove))}
        {hidden > 0 && (
          <button
            type="button"
            className="qf-chip qf-chip--more"
            onClick={onExpand}
            aria-label={`Show ${hidden} more active filter${hidden > 1 ? "s" : ""}`}
          >
            +{hidden} more
          </button>
        )}
        <button
          type="button"
          className="qf-chip-clear"
          onClick={() => setFilters(EMPTY_FILTERS)}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
