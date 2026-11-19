"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { dur, ease } from "@/lib/motion";
import type { PageState } from "@/lib/prototype-registry";
import { cn } from "@/lib/utils";

/** `key` / `group` are landing on PageState; read them through this until the type has them. */
type StateMeta = PageState & { key?: boolean; group?: string };
const meta = (st: PageState) => st as StateMeta;

/** Inline segments per screen when none are flagged `key: true`. */
const DEFAULT_INLINE = 4;

/**
 * Which states sit inline in the pill: the `key: true` ones, else the first four (four or
 * fewer: all of them). An active state that isn't inline is appended (max one extra), so the
 * selection is always visible. `hiddenCount` = states only reachable through More.
 */
export function splitStates(states: PageState[], activeId?: string) {
  const keyed = states.filter((st) => meta(st).key);
  const base = keyed.length ? keyed : states.slice(0, DEFAULT_INLINE);
  const baseIds = new Set(base.map((st) => st.id));
  const extra = activeId && !baseIds.has(activeId) ? states.find((st) => st.id === activeId) : undefined;
  return {
    inline: extra ? [...base, extra] : base,
    extraId: extra?.id,
    hiddenCount: states.length - base.length,
  };
}

/** Groups in first-appearance order; ungrouped states first, with no heading. */
function grouped(states: PageState[]) {
  const loose: PageState[] = [];
  const groups = new Map<string, PageState[]>();
  for (const st of states) {
    const g = meta(st).group;
    if (!g) loose.push(st);
    else groups.set(g, [...(groups.get(g) ?? []), st]);
  }
  return { loose, groups: [...groups.entries()] };
}

const MARGIN = 8;
const GAP = 8;
const MAX_W = 340;
const MAX_H = 440;

/**
 * "More · N" in the state pill: every state of the screen, grouped, in a menu portaled to
 * body (AGENTS floating-layer rule) and anchored ABOVE the pill, which sits at the bottom.
 * z 211 = one over the pill's prototype tier.
 */
export function ProtoStateMenu({
  states,
  activeId,
  hiddenCount,
  onPick,
  anchorRef,
}: {
  states: PageState[];
  activeId?: string;
  hiddenCount: number;
  onPick: (st: PageState) => void;
  /** The pill: the menu sits above its top edge. */
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number; maxHeight: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  // Position before paint: above the pill, right edge on the More button, clamped to the viewport.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const top = anchorRef.current?.getBoundingClientRect().top ?? b.top;
    const vw = window.innerWidth;
    const width = Math.min(MAX_W, vw - MARGIN * 2);
    const left = Math.min(Math.max(MARGIN, b.right - width), vw - width - MARGIN);
    setPos({
      left,
      width,
      bottom: window.innerHeight - top + GAP,
      maxHeight: Math.max(160, Math.min(MAX_H, top - GAP - MARGIN)),
    });
  }, [open, anchorRef]);

  // Focus the active row (else the first) once open.
  useEffect(() => {
    if (!open || !pos) return;
    const pop = popRef.current;
    const el = pop?.querySelector<HTMLElement>('[aria-checked="true"]') ?? pop?.querySelector<HTMLElement>("[role=menuitemradio]");
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest" });
  }, [open, pos]);

  // Dismiss: outside click (excluding the portaled menu), Escape, resize, scroll outside the menu.
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) =>
      t instanceof Node && (btnRef.current?.contains(t) || popRef.current?.contains(t));
    const onDown = (e: MouseEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = [...(popRef.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]") ?? [])];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % items.length;
    else if (e.key === "ArrowUp") next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Tab") {
      e.preventDefault();
      close(true);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    items[next].focus();
  };

  const pick = (st: PageState) => {
    close(true);
    onPick(st);
  };

  const { loose, groups } = grouped(states);
  const row = (st: PageState) => {
    const on = st.id === activeId;
    const planned = st.status === "planned";
    return (
      <button
        key={st.id}
        type="button"
        role="menuitemradio"
        aria-checked={on}
        tabIndex={-1}
        data-state={st.id}
        className={cn("proto-more-item", on && "on", planned && "is-planned")}
        onClick={() => pick(st)}
      >
        <span className="proto-more-check" aria-hidden="true">
          {on && <Icon name="check" size={15} />}
        </span>
        <span className="proto-more-body">
          <span className="proto-more-lb">
            <span className="proto-more-name">{st.label}</span>
            {planned && <span className="proto-more-chip">Planned</span>}
          </span>
          {st.description && <span className="proto-more-desc">{st.description}</span>}
        </span>
      </button>
    );
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="proto-btn proto-more"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More states (${hiddenCount} more)`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>More · {hiddenCount}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popRef}
                className="proto-more-pop"
                role="menu"
                aria-label="All states"
                onKeyDown={onMenuKey}
                // Parked offscreen until measured (no unpositioned flash).
                style={
                  pos
                    ? { left: pos.left, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }
                    : { left: -9999, bottom: 0 }
                }
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { duration: dur.quick, ease: ease.enter } }}
                exit={{ opacity: 0, y: 4, transition: { duration: dur.quick, ease: ease.exit } }}
              >
                {loose.map(row)}
                {groups.map(([name, list]) => (
                  <div key={name} role="group" aria-label={name} className="proto-more-group">
                    <div className="proto-more-h" aria-hidden="true">
                      {name}
                    </div>
                    {list.map(row)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
