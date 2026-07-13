"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { VersionHistoryTable, type VersionRow } from "./VersionHistoryTable";

/** A configurable data column (the middle columns between Name and Actions). */
export interface FamilyColumn {
  key: string;
  label: string;
  /** CSS grid track, e.g. "96px" or "minmax(120px, max-content)". */
  width: string;
}

export interface FamilyRow {
  id: string;
  name: string;
  /** Chips shown after the name (Default / Draft in progress). */
  badges?: React.ReactNode;
  /** Cell content keyed by column key. */
  cells: Record<string, React.ReactNode>;
  versions: VersionRow[];
  contentsHeader?: string;
  /** Overflow (⋯) actions — the only actions cell (review-queue parity). */
  menuItems: ActionItem[];
  /** Open the published item (or draft if none) — the Name link. */
  onOpen: () => void;
  onViewVersion: (versionId: string) => void;
  onPromoteVersion?: (versionId: string) => void;
  onDuplicateVersion?: (versionId: string) => void;
  onDeleteVersion?: (versionId: string) => void;
}

/** One family row: expand chevron · name+badges · configurable cells · ⋯.
 *  Clicking the row body toggles the inline version history; the Name is a link
 *  to the published item; every write action lives in the ⋯ menu. */
function Row({
  row,
  columns,
  template,
}: {
  row: FamilyRow;
  columns: FamilyColumn[];
  template: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ckrow-wrap">
      <div
        className={`ckrow${open ? " is-open" : ""}`}
        style={{ gridTemplateColumns: template }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className="ckrow-caret" aria-hidden>
          <Icon
            name="chevron-down"
            size={16}
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        </span>

        <span className="ckrow-name">
          <button
            type="button"
            className="fam-title"
            onClick={(e) => {
              e.stopPropagation();
              row.onOpen();
            }}
          >
            {row.name}
          </button>
          {row.badges}
        </span>

        {columns.map((c) => (
          <span key={c.key} className="ckrow-cell">
            {row.cells[c.key]}
          </span>
        ))}

        <span className="ckrow-actions" onClick={(e) => e.stopPropagation()}>
          <ActionMenu items={row.menuItems} tooltip="More actions" />
        </span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="ckexpand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="ckexpand-inner">
              <VersionHistoryTable
                versions={row.versions}
                contentsHeader={row.contentsHeader}
                onView={row.onViewVersion}
                onPromote={row.onPromoteVersion}
                onDuplicate={row.onDuplicateVersion}
                onDelete={row.onDeleteVersion}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A versioned template library as a proper table: hairline-separated family rows
 *  in one card, each expanding to its version history. Columns are configurable so
 *  the same pattern drives checklists (Items/Used) and workbook layouts
 *  (Profile/Sections). */
export function FamilyTable({
  columns,
  rows,
  ariaLabel,
}: {
  columns: FamilyColumn[];
  rows: FamilyRow[];
  ariaLabel: string;
}) {
  // chevron · name · …columns · actions
  const template = `40px minmax(220px, 1fr) ${columns
    .map((c) => c.width)
    .join(" ")} 52px`;

  return (
    <div className="cktable" role="table" aria-label={ariaLabel}>
      <div className="ckcols" role="row" style={{ gridTemplateColumns: template }}>
        <span aria-hidden />
        <span role="columnheader">Name</span>
        {columns.map((c) => (
          <span key={c.key} role="columnheader">
            {c.label}
          </span>
        ))}
        <span role="columnheader" aria-label="Actions" />
      </div>
      {rows.map((row) => (
        <Row key={row.id} row={row} columns={columns} template={template} />
      ))}
    </div>
  );
}
