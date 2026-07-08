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
  type WbSection,
  type WbSectionType,
  type WbFact,
} from "@/lib/workbook-config";
import { GridCell } from "./WorkbookExhibits";
import type { WorkbookEditingActions } from "./WorkbookInline";

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
  /** Types already in the document (singletons filter out of the palette). */
  presentTypes: WbSectionType[];
  edit: WorkbookEditingActions;
}) {
  const palette: ActionItem[] = PALETTE_TYPES.filter(
    (t) => !(SINGLETON_TYPES.includes(t) && presentTypes.includes(t)),
  ).map((t) => ({
    label: SECTION_TYPE_LABEL[t],
    icon: "add",
    onClick: () => edit.onInsertSection(t, beforeId),
  }));

  return (
    <div className="wb-adddiv" role="group" aria-label="Insert here">
      <span className="wb-adddiv-line" aria-hidden="true" />
      <ActionMenu
        items={palette}
        menuClassName="wb-adddiv-menu"
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
  // The drag ghost trails the pointer on springs — the "thing in hand" cue.
  const ghostRawX = useMotionValue(0);
  const ghostRawY = useMotionValue(0);
  const ghostX = useSpring(ghostRawX, { stiffness: 650, damping: 42, mass: 0.55 });
  const ghostY = useSpring(ghostRawY, { stiffness: 650, damping: 42, mass: 0.55 });

  // Keep refs in sync (post-render) so the window listeners read fresh values
  // without the drag effect re-subscribing on every render mid-drag.
  useEffect(() => {
    dragRef.current = dragId;
    dropRef.current = dropId;
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    if (!dragId) return;
    const move = (ev: PointerEvent) => {
      ghostRawX.set(ev.clientX + 16);
      ghostRawY.set(ev.clientY + 12);
      const shells = Array.from(
        document.querySelectorAll<HTMLElement>("[data-wb-sec]"),
      );
      let target = "__end__";
      for (const el of shells) {
        const sid = el.dataset.wbSec!;
        if (sid === dragRef.current) continue;
        const r = el.getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) {
          target = sid;
          break;
        }
      }
      setDropId(target);
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
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.classList.remove("wb-reordering");
    };
    // Motion values are stable references — safe in deps.
  }, [dragId, ghostRawX, ghostRawY]);

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    // Park the ghost at the grab point instantly (no fly-in from 0,0).
    ghostRawX.jump(e.clientX + 16);
    ghostRawY.jump(e.clientY + 12);
    setDragId(id);
  };

  return { dragId, dropId, startDrag, ghostX, ghostY };
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
