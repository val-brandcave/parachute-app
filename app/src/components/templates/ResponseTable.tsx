"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { ActionMenu } from "@/components/molecules";
import type { ResponseTemplate } from "@/types";
import type { ResponseGroup } from "@/app/(shell)/configure/responses/hooks/useResponseLibrary";

// chevron · group name · template count · (actions gutter, empty on group rows)
const GRID = "40px minmax(220px, 1fr) 108px 52px";

/** One collapsible group: header row (name + count) expands to its template
 *  rows. Clicking a template row opens the edit modal; per-template writes live
 *  in the row's ⋯ menu. Same visual language as the checklist/workbook tables. */
function GroupRow({
  group,
  items,
  defaultOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  group: string;
  items: ResponseTemplate[];
  defaultOpen: boolean;
  onEdit: (t: ResponseTemplate) => void;
  onDuplicate: (t: ResponseTemplate) => void;
  onDelete: (t: ResponseTemplate) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="ckrow-wrap">
      <div
        className={`ckrow${open ? " is-open" : ""}`}
        style={{ gridTemplateColumns: GRID }}
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
          <span className="rtl-group-name">{group}</span>
        </span>
        <span className="ckrow-cell rtl-group-count">
          {items.length} {items.length === 1 ? "template" : "templates"}
        </span>
        <span aria-hidden />
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
            <div className="rtl-items">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="rtl-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => onEdit(t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEdit(t);
                    }
                  }}
                >
                  <span className="rtl-item-name">{t.name}</span>
                  <span className="rtl-item-prev">{t.body}</span>
                  <span
                    className="rtl-item-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionMenu
                      tooltip="More actions"
                      items={[
                        { label: "Edit", icon: "edit", onClick: () => onEdit(t) },
                        {
                          label: "Duplicate",
                          icon: "copy",
                          onClick: () => onDuplicate(t),
                        },
                        { divider: true },
                        {
                          label: "Delete",
                          icon: "trash",
                          danger: true,
                          onClick: () => onDelete(t),
                        },
                      ]}
                    />
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The response-template library as a proper table: hairline-separated group
 *  rows in one card, each expanding to its templates. */
export function ResponseTable({
  groups,
  emptyLabel,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  groups: ResponseGroup[];
  emptyLabel: string;
  onEdit: (t: ResponseTemplate) => void;
  onDuplicate: (t: ResponseTemplate) => void;
  onDelete: (t: ResponseTemplate) => void;
}) {
  return (
    <div className="cktable" role="table" aria-label="Response templates">
      <div className="ckcols" role="row" style={{ gridTemplateColumns: GRID }}>
        <span aria-hidden />
        <span role="columnheader">Group</span>
        <span role="columnheader">Templates</span>
        <span role="columnheader" aria-label="Actions" />
      </div>

      {groups.length === 0 ? (
        <div className="rtl-empty">{emptyLabel}</div>
      ) : (
        groups.map((g, i) => (
          <GroupRow
            key={g.group}
            group={g.group}
            items={g.items}
            // Open the first group by default so the table doesn't read as empty.
            defaultOpen={i === 0}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
