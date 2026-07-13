"use client";

import { motion } from "framer-motion";
import { Chip, type ChipTone } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { VERSION_STATUS_LABEL } from "@/lib/template-versions";
import type { VersionStatus } from "@/types";

export interface VersionRow {
  id: string;
  version: number;
  status: VersionStatus;
  /** Pre-formatted publish date, e.g. "May 12, 2026". */
  dateLabel: string;
  /** Contents summary, e.g. "22 items" / "6 sections". */
  summary: string;
}

const STATUS_TONE: Record<VersionStatus, ChipTone> = {
  published: "accent",
  draft: "flag",
  archived: "na",
};

// Flat, scannable version history: hairline-separated rows on the card surface
// (no nested boxes). The published row is the active snapshot — tinted. Row
// actions live in a ⋯ menu so the table stays calm.
export function VersionHistoryTable({
  versions,
  contentsHeader = "Contents",
  onView,
  onPromote,
  onDuplicate,
  onDelete,
}: {
  versions: VersionRow[];
  contentsHeader?: string;
  onView: (versionId: string) => void;
  onPromote?: (versionId: string) => void;
  onDuplicate?: (versionId: string) => void;
  onDelete?: (versionId: string) => void;
}) {
  return (
    <div className="vh-table" role="table" aria-label="Version history">
      <div className="vh-head" role="row">
        <span role="columnheader">Version</span>
        <span role="columnheader">{contentsHeader}</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Published</span>
        <span role="columnheader" className="vh-actions-col" aria-label="Actions" />
      </div>
      {versions.map((v, i) => {
        const items: ActionItem[] = [
          {
            label: v.status === "draft" ? "Open draft" : "View",
            icon: "eye",
            onClick: () => onView(v.id),
          },
        ];
        if (onPromote && v.status === "archived")
          items.push({ label: "Promote to published", icon: "publish", onClick: () => onPromote(v.id) });
        if (onDuplicate && v.status !== "draft")
          items.push({ label: "Duplicate as new draft", icon: "copy", onClick: () => onDuplicate(v.id) });
        if (onDelete && v.status === "archived")
          items.push(
            { divider: true },
            { label: "Delete version", icon: "trash", danger: true, onClick: () => onDelete(v.id) },
          );

        return (
          <motion.div
            key={v.id}
            role="row"
            className={`vh-row${v.status === "published" ? " vh-row--active" : ""}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: i * 0.03 }}
          >
            <span role="cell">
              <span className="vh-vbadge">v{v.version}</span>
            </span>
            <span className="vh-contents" role="cell">
              {v.summary}
            </span>
            <span role="cell">
              <Chip tone={STATUS_TONE[v.status]}>
                {VERSION_STATUS_LABEL[v.status]}
              </Chip>
            </span>
            <span className="vh-date" role="cell">
              {v.status === "draft" ? "—" : v.dateLabel}
            </span>
            <span className="vh-row-actions" role="cell">
              <ActionMenu items={items} tooltip="Version actions" />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
