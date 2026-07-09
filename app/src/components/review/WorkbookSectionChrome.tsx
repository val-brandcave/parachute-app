"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { Icon } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules/ActionMenu";
import {
  PALETTE_TYPES,
  SINGLETON_TYPES,
  SECTION_TYPE_LABEL,
  SECTION_TYPE_ICON,
  SECTION_TYPE_DESC,
  availableCategories,
  type WbSection,
  type WbSectionType,
  type WbFact,
} from "@/lib/workbook-config";
import { GridCell } from "./WorkbookExhibits";
import { CommentAnchor } from "./WorkbookComments";
import type { WorkbookEditingActions } from "./WorkbookInline";
import type { Finding, WorkbookExhibits } from "@/types";

/**
 * On-canvas section chrome (Phase 2a.5, F-144) — the HubSpot-builder mechanic
 * on our paper: hover a section → petrol outline + a floating navy action pill
 * (Rename · per-type tools · Hide · Duplicate · Delete) + a ⠿ drag handle that
 * reorders with a live drop-indicator line. Explicitly NOT HubSpot's side
 * inspector panel (Jeff's "CRO feel" / Ed's "grid on the left" objections):
 * every tool lives on the element itself.
 *
 * Section behavior is TYPE-DRIVEN via the capability registry below — the
 * §5 matrix in code, and where Phase 2b extends per-type tooling.
 */

/* ---- capability registry: what each section type allows on canvas ---- */

interface SectionCaps {
  rename: boolean;
  hide: boolean;
  /** Singletons can't be duplicated (one per document). */
  duplicate: boolean;
  del: boolean;
}

export function sectionCaps(type: WbSectionType): SectionCaps {
  // Certification anchors the sign flow — it can be renamed/hidden, never
  // removed or doubled. Everything else follows the singleton rule.
  if (type === "certification")
    return { rename: true, hide: true, duplicate: false, del: false };
  return {
    rename: true,
    hide: true,
    duplicate: !SINGLETON_TYPES.includes(type),
    del: true,
  };
}

/* ---- section shell: outline + toolbar + rename + drag handle ---- */

export function SectionShell({
  sec,
  label,
  edit,
  dragging,
  dropBefore,
  dropAfter,
  onHandleDown,
  extras,
  children,
}: {
  sec: WbSection;
  label: string;
  edit: WorkbookEditingActions;
  /** This section is the one being dragged. */
  dragging: boolean;
  /** The drop-indicator line renders above / below this section. */
  dropBefore: boolean;
  dropAfter: boolean;
  onHandleDown: (e: React.PointerEvent) => void;
  /** Per-type toolbar extras (exhibit mode cycler, sensitivity columns…). */
  extras?: React.ReactNode;
  children: React.ReactNode;
}) {
  const caps = sectionCaps(sec.type);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(sec.title);

  const commitRename = () => {
    setRenaming(false);
    const t = draft.trim();
    if (t && t !== sec.title) edit.onUpdateSection(sec.id, { title: t });
  };

  return (
    <section
      className={`wb-sec wb-shell${dragging ? " is-dragging" : ""}${
        dropBefore ? " is-drop-before" : ""
      }${dropAfter ? " is-drop-after" : ""}`}
      id={`wb-sec-${sec.id}`}
      data-wb-sec={sec.id}
    >
      <button
        type="button"
        className="wb-shell-grip"
        aria-label={`Drag to reorder ${sec.title}`}
        title="Drag to reorder"
        onPointerDown={onHandleDown}
      >
        <Icon name="grip" size={15} />
      </button>

      {/* Comment pin — hangs in the right gutter, aligned to the section top. */}
      <CommentAnchor anchorId={sec.id} anchorLabel={sec.title} edit={edit} />

      <div className="wb-shell-bar" role="toolbar" aria-label={`${sec.title} tools`}>
        {caps.rename && (
          <button
            className="wb-shell-act"
            onClick={() => {
              setDraft(sec.title);
              setRenaming(true);
            }}
          >
            <Icon name="edit" size={12} /> Rename
          </button>
        )}
        {extras}
        {caps.hide && (
          <button
            className="wb-shell-act"
            onClick={() => edit.onToggleSection(sec.id)}
            title="Hide from the document (restore from the stub or Customize)"
          >
            <Icon name="eye-off" size={12} /> Hide
          </button>
        )}
        {caps.duplicate && (
          <button className="wb-shell-act" onClick={() => edit.onDuplicateSection(sec.id)}>
            <Icon name="copy" size={12} /> Duplicate
          </button>
        )}
        {caps.del && (
          <button
            className="wb-shell-act wb-shell-act--danger"
            onClick={() => edit.onDeleteSection(sec.id)}
          >
            <Icon name="trash" size={12} /> Delete
          </button>
        )}
      </div>

      <h3 className="wb-sec-h" style={{ fontFamily: "var(--wb-head)" }}>
        <span className="wb-sec-n">{label}</span>
        {renaming ? (
          <input
            className="wb-sec-rename"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                e.stopPropagation();
                setRenaming(false);
              }
            }}
            aria-label="Section title"
          />
        ) : (
          sec.title
        )}
      </h3>
      {children}
    </section>
  );
}

/* ---- hidden-section stub: Hide stays reversible on the canvas ---- */

export function HiddenSectionStub({
  sec,
  onShow,
  dropBefore,
}: {
  sec: WbSection;
  onShow: () => void;
  /** The drag drop-indicator line renders above this stub. */
  dropBefore?: boolean;
}) {
  return (
    <div className={`wb-stub${dropBefore ? " is-drop-before" : ""}`} data-wb-sec={sec.id}>
      <Icon name="eye-off" size={13} />
      <span className="wb-stub-title">{sec.title}</span>
      <span className="wb-stub-tag">hidden — not printed</span>
      <button className="wb-stub-show" onClick={onShow}>
        <Icon name="eye" size={12} /> Show
      </button>
    </div>
  );
}

/* ---- add divider: ＋ Add section (palette) ----
   Sections insert AT a position; findings are first-class OBJECTS that belong
   to a chapter, so "＋ Add finding" lives at the foot of each findings section
   (category pre-filled), not on this divider. */

export function AddDivider({
  beforeId,
  presentTypes,
  edit,
}: {
  /** Insert position — the section this divider precedes (null = end). */
  beforeId: string | null;
  /** Types already in the document (singletons already present render dimmed). */
  presentTypes: WbSectionType[];
  edit: WorkbookEditingActions;
}) {
  // Enriched palette (F-152): icon + name + one-line description per type — a
  // reviewer shouldn't have to know "sensitivity" vs "exhibits". Singletons that
  // already exist stay VISIBLE but dimmed (so the catalog reads complete), rather
  // than silently vanishing as they did before.
  const palette: ActionItem[] = [
    { header: true, label: "Add a section" },
    ...PALETTE_TYPES.map((t) => {
      const taken = SINGLETON_TYPES.includes(t) && presentTypes.includes(t);
      return {
        label: SECTION_TYPE_LABEL[t],
        description: taken ? "Already in the document" : SECTION_TYPE_DESC[t],
        icon: SECTION_TYPE_ICON[t],
        disabled: taken,
        onClick: () => edit.onInsertSection(t, beforeId),
      } satisfies ActionItem;
    }),
  ];

  return (
    <div className="wb-adddiv" role="group" aria-label="Insert here">
      <span className="wb-adddiv-line" aria-hidden="true" />
      <ActionMenu
        items={palette}
        menuClassName="wb-addpalette"
        trigger={({ open, toggle }) => (
          <button className={`wb-adddiv-btn${open ? " on" : ""}`} onClick={toggle}>
            <Icon name="add" size={12} /> Add section
          </button>
        )}
      />
      <span className="wb-adddiv-line" aria-hidden="true" />
    </div>
  );
}

/* ---- section settings popover (⚙): non-content config, on the element ----
   The client builder's per-section settings cards, adapted to our canvas: an
   on-element ⚙ popover (NOT a docked side inspector — Jeff's "CRO feel"), built
   on the house ActionMenu so it's portaled + viewport-clamped for free. CONTENT
   still edits inline on the paper; only configuration lives here. Type-driven —
   only types with real settings show the ⚙ (see `hasSectionSettings`). */

const SETTINGS_TYPES: WbSectionType[] = [
  "exhibits",
  "findings",
  "sensitivity",
  "conclusion",
];

export function hasSectionSettings(type: WbSectionType): boolean {
  return SETTINGS_TYPES.includes(type);
}

/** The visible findings chapters + their display number — lets the routing menu
 *  show where each category currently lives ("In §5 · Cost Approach"). */
export interface FindingsSectionInfo {
  id: string;
  title: string;
  label: string;
  categories: string[];
}

export function SectionSettings({
  sec,
  edit,
  exhibits,
  findings,
  findingsSections,
}: {
  sec: WbSection;
  edit: WorkbookEditingActions;
  exhibits: WorkbookExhibits | null;
  findings: Finding[];
  /** All visible findings chapters (for exclusive-routing ownership hints). */
  findingsSections: FindingsSectionInfo[];
}) {
  if (!hasSectionSettings(sec.type)) return null;

  let items: ActionItem[] = [];

  if (sec.type === "exhibits") {
    // Per-series show/hide (client ref: the Table/Chart-per-series card). Our
    // three series are each single-form, so a toggle is the honest control.
    const series = sec.series ?? { adjustmentGrid: true, psf: true, capRate: true };
    const toggle = (key: keyof typeof series) => () =>
      edit.onUpdateSection(sec.id, { series: { ...series, [key]: !series[key] } });
    items = [
      { header: true, label: "Exhibit series" },
      { label: "Sales adjustment grid", selected: series.adjustmentGrid, keepOpen: true, onClick: toggle("adjustmentGrid") },
      { label: "Adjusted $/SF chart", selected: series.psf, keepOpen: true, onClick: toggle("psf") },
      { label: "Cap-rate comparison", selected: series.capRate, keepOpen: true, onClick: toggle("capRate") },
    ];
  } else if (sec.type === "findings") {
    // Exclusive routing (F-152): a category lives in exactly ONE chapter, so a
    // finding can never print twice. Checking a category here MOVES it here
    // (removing it from wherever it was); each row shows its current home so the
    // partition is legible. Unchecking unassigns it (surfaced as a warning).
    const current = sec.categories ?? [];
    const all = Array.from(new Set([...availableCategories(findings), ...current]));
    const ownerOf = (cat: string) =>
      findingsSections.find((fs) => fs.id !== sec.id && fs.categories.includes(cat));
    items = [
      { header: true, label: "Route finding categories" },
      ...all.map((cat) => {
        const mine = current.includes(cat);
        const owner = mine ? undefined : ownerOf(cat);
        const description = mine
          ? "In this section"
          : owner
            ? `In §${owner.label} · ${owner.title}`
            : "Not shown in any section";
        return {
          label: cat,
          description,
          selected: mine,
          keepOpen: true,
          onClick: () => edit.onRouteCategory(cat, mine ? null : sec.id),
        };
      }),
    ];
  } else if (sec.type === "sensitivity" && exhibits) {
    // Scenario columns (moved off the toolbar cycler into settings). Radio 3..N,
    // centred on the selected column by `visibleSensitivityCols` at render.
    const total = exhibits.sensitivity.cols.length;
    const n = Math.min(sec.sensitivityCols ?? total, total);
    items = [
      { header: true, label: "Scenario columns" },
      ...Array.from({ length: total - 2 }, (_, i) => i + 3).map((cols) => ({
        label: `${cols} columns`,
        selected: n === cols,
        onClick: () => edit.onUpdateSection(sec.id, { sensitivityCols: cols }),
      })),
    ];
  } else if (sec.type === "conclusion") {
    // Show due/timing on action items (client ref's "Show due/timing column").
    const showTiming = sec.showActionTiming !== false;
    items = [
      { header: true, label: "Action items" },
      {
        label: "Show due / timing",
        selected: showTiming,
        keepOpen: true,
        onClick: () => edit.onUpdateSection(sec.id, { showActionTiming: !showTiming }),
      },
    ];
  }

  if (!items.length) return null;

  return (
    <ActionMenu
      items={items}
      menuClassName="wb-settings-menu"
      trigger={({ open, toggle }) => (
        <button
          className={`wb-shell-act${open ? " is-open" : ""}`}
          onClick={toggle}
          title="Section settings"
        >
          <Icon name="settings" size={12} /> Settings
        </button>
      )}
    />
  );
}

/* ---- editable fact grid (summary section "metric tiles") ---- */

export function FactGridEditor({
  facts,
  onCommit,
}: {
  facts: WbFact[];
  onCommit: (next: WbFact[]) => void;
}) {
  return (
    <>
      <div className="wb-facts wb-facts--edit">
        {facts.map((f, i) => (
          <div key={i} className={`wb-fact${f.big ? " wb-fact--big" : ""}`}>
            <span className="wb-fact-l">
              <GridCell
                raw={f.label}
                display={f.label}
                onCommit={(v) =>
                  v.trim() &&
                  onCommit(facts.map((x, j) => (j === i ? { ...x, label: v.trim() } : x)))
                }
              />
            </span>
            <span className="wb-fact-v">
              <GridCell
                raw={f.value}
                display={f.value}
                onCommit={(v) =>
                  v.trim() &&
                  onCommit(facts.map((x, j) => (j === i ? { ...x, value: v.trim() } : x)))
                }
              />
            </span>
            <button
              className="wb-rowdel wb-fact-del"
              onClick={() => onCommit(facts.filter((_, j) => j !== i))}
              aria-label={`Delete ${f.label}`}
              title="Delete fact"
            >
              <Icon name="trash" size={12} />
            </button>
          </div>
        ))}
        <button
          className="wb-fact wb-fact--add"
          onClick={() => onCommit([...facts, { label: "New fact", value: "—" }])}
        >
          <Icon name="add" size={14} /> Add fact
        </button>
      </div>
    </>
  );
}

/* ---- drag-to-reorder controller (pointer-based, spans page boundaries) ---- */

export function useSectionDrag(
  onDrop: (dragId: string, beforeId: string | null) => void,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null); // section id | "__end__"
  const dragRef = useRef<string | null>(null);
  const dropRef = useRef<string | null>(null);
  const onDropRef = useRef(onDrop);
  // Last pointer position (updated on move; read by the auto-scroll rAF loop so
  // scrolling continues even when the pointer is held still at an edge).
  const pointer = useRef({ x: 0, y: 0 });
  const scrollElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // The drag ghost trails the pointer on springs — the "thing in hand" cue.
  const ghostRawX = useMotionValue(0);
  const ghostRawY = useMotionValue(0);
  const ghostX = useSpring(ghostRawX, { stiffness: 750, damping: 44, mass: 0.5 });
  const ghostY = useSpring(ghostRawY, { stiffness: 750, damping: 44, mass: 0.5 });

  // Keep refs in sync (post-render) so the window listeners read fresh values
  // without the drag effect re-subscribing on every render mid-drag.
  useEffect(() => {
    dragRef.current = dragId;
    dropRef.current = dropId;
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    if (!dragId) return;

    // The scrollable ancestor of the dragged section — the document stage. We
    // auto-scroll it when the pointer nears an edge so a long doc stays reachable.
    scrollElRef.current = findScrollParent(
      document.querySelector<HTMLElement>(`[data-wb-sec="${dragId}"]`),
    );

    // Drop target = the first section whose vertical midpoint is below the
    // pointer (null/"__end__" = drop at the very end). Reads the shared pointer
    // ref so it stays correct during auto-scroll, not just on pointer move.
    const computeDrop = () => {
      const y = pointer.current.y;
      const shells = Array.from(
        document.querySelectorAll<HTMLElement>("[data-wb-sec]"),
      );
      let target = "__end__";
      for (const el of shells) {
        const sid = el.dataset.wbSec!;
        if (sid === dragRef.current) continue;
        const r = el.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          target = sid;
          break;
        }
      }
      if (target !== dropRef.current) setDropId(target);
    };

    const move = (ev: PointerEvent) => {
      pointer.current = { x: ev.clientX, y: ev.clientY };
      ghostRawX.set(ev.clientX + 16);
      ghostRawY.set(ev.clientY + 12);
      computeDrop();
    };

    // Edge auto-scroll — a rAF loop (so it keeps going when the pointer is held
    // still) that scrolls the stage when the pointer is within EDGE of a border,
    // ramping speed with proximity. Re-derives the drop target as content moves.
    const EDGE = 84;
    const MAX_SPEED = 24;
    const speedFrom = (dist: number) =>
      Math.min(MAX_SPEED, (Math.min(dist, EDGE) / EDGE) * MAX_SPEED);
    const tick = () => {
      const el = scrollElRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const y = pointer.current.y;
        let dy = 0;
        if (y < r.top + EDGE) dy = -speedFrom(r.top + EDGE - y);
        else if (y > r.bottom - EDGE) dy = speedFrom(y - (r.bottom - EDGE));
        if (Math.abs(dy) >= 0.5) {
          el.scrollBy(0, dy);
          computeDrop();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const up = () => {
      const drag = dragRef.current;
      const drop = dropRef.current;
      setDragId(null);
      setDropId(null);
      if (drag && drop) onDropRef.current(drag, drop === "__end__" ? null : drop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.classList.add("wb-reordering");
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      document.body.classList.remove("wb-reordering");
    };
    // Motion values are stable references — safe in deps.
  }, [dragId, ghostRawX, ghostRawY]);

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    const gx = e.clientX + 16;
    const gy = e.clientY + 12;
    pointer.current = { x: e.clientX, y: e.clientY };
    // Park BOTH the source and the spring output at the grab point — jumping only
    // the source lets the spring animate in from 0,0 (the ghost's "fly-in" lag).
    ghostRawX.jump(gx);
    ghostRawY.jump(gy);
    ghostX.jump(gx);
    ghostY.jump(gy);
    setDragId(id);
  };

  return { dragId, dropId, startDrag, ghostX, ghostY };
}

/** Nearest scrollable ancestor of `el` (the document stage during a section
 *  drag) — walks up until it finds one that actually overflows, so edge
 *  auto-scroll targets the real scroller and not a clipped wrapper. */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight)
      return node;
    node = node.parentElement;
  }
  return null;
}

/** The cursor-following drag ghost — a lifted paper chip carrying the dragged
 *  section's number + title, trailing the pointer on a spring. Portaled to
 *  body (chrome context) so page overflow can never clip it. */
export function SectionDragGhost({
  label,
  title,
  x,
  y,
}: {
  label: string;
  title: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <motion.div
      className="wb-dragghost"
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
      animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-hidden="true"
    >
      <span className="wb-dragghost-grip">
        <Icon name="grip" size={13} />
      </span>
      {label && <span className="wb-dragghost-n">{label}</span>}
      <span className="wb-dragghost-t">{title}</span>
    </motion.div>,
    document.body,
  );
}
